import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';
import AgentNameModal from '../../ui/AgentNameModal';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { fetchEntryCounts, incrementFormEntry } from '../../ui/api';

const AgentForm = ({ onCancel, onSubmitSuccess, editingEntry }) => {
    const { user } = useAppContext();
    const [agentNames, setAgentNames] = useState([]);
    const [isLoadingNames, setIsLoadingNames] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [hideFields, setHideFields] = useState(false);
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const isEditing = !!editingEntry;

    const initialValues = {
        agent_name: editingEntry?.agent_name || '',
        date: editingEntry?.date || '',
        employee: editingEntry?.employee || user?.username || '', 
        entry: editingEntry?.entry || `AG ${entryNumber}/${totalEntries}`, 
        detail: editingEntry?.detail || '',
        credit: editingEntry?.credit ? editingEntry.credit.toString() : '',
        debit: editingEntry?.debit ? editingEntry.debit.toString() : '',
        paid_cash: editingEntry?.paid_cash ? editingEntry.paid_cash.toString() : '', 
        paid_bank: editingEntry?.paid_bank ? editingEntry.paid_bank.toString() : '',
        balance: '',
    };

    const validationSchema = Yup.object({
        agent_name: Yup.string().required('Agent name is required'),
        date: Yup.date().required('Date is required'),
        employee: Yup.string().required('Employee is required'),
        entry: Yup.string().required('Entry is required'),
        detail: Yup.string().required('Detail is required'),
        credit: Yup.number().min(0, 'Credit must be positive'),
        debit: Yup.number().min(0, 'Debit must be positive'),
        paid_cash: Yup.number().min(0, 'Paid Cash must be positive'),
        paid_bank: Yup.number().min(0, 'Paid Bank must be positive'),
        balance: Yup.number().when('$hideFields', {
            is: true,
            then: (schema) => schema.required('Opening Balance is required'),
            otherwise: (schema) => schema
        }),
    }).test('credit-debit-balance-test', null, function(values) {
        if (hideFields && !isEditing) {
            // When opening balance is checked, only balance is required
            if (!values.balance && values.balance !== 0) {
                return this.createError({
                    path: 'balance',
                    message: 'Enter Opening Balance'
                });
            }
        } else {
            // Normal mode - either credit or debit is required
            if (!values.credit && !values.debit) {
                return this.createError({
                    path: 'credit',
                    message: 'Either Credit or Debit is required'
                });
            }
        }
        return true;
    });

    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const agentCounts = counts.find(c => c.form_type === 'agent');
                if (agentCounts) {
                    setEntryNumber(agentCounts.current_count + 1);
                    setTotalEntries(agentCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
            } else {
                setEntryNumber(1);
                setTotalEntries(1);
            }
        };
        getCounts();
    }, []);

    useEffect(() => {
        if (!isEditing) {
            setAgentNames(prev => [...prev]);
        }
    }, [entryNumber, totalEntries, isEditing]);

    const fetchAgentNames = async () => {
        try {
            setIsLoadingNames(true);
            const response = await axios.get(`${BASE_URL}/agent-names/existing`);
            if (response.data.status === 'success') {
                setAgentNames(response.data.agentNames || []);
            }
        } catch (error) {
            console.error('Error fetching agent names:', error);
        } finally {
            setIsLoadingNames(false);
        }
    };

    useEffect(() => {
        fetchAgentNames();
    }, []);

    const handleAgentAdded = async (newAgentName) => {
        if (!agentNames.includes(newAgentName)) {
            setAgentNames(prev => [...prev, newAgentName].sort());
        }
        return Promise.resolve();
    };

    const handleCheckboxChange = (e, setFieldValue) => {
        // Don't allow changing to "Opening Balance" mode when editing
        if (isEditing) return;
        
        const isChecked = e.target.checked;
        setHideFields(isChecked);
        
        if (isChecked) {
            setFieldValue('credit', '');
            setFieldValue('debit', '');
            setFieldValue('paid_cash', '');
            setFieldValue('paid_bank', '');
        } else {
            setFieldValue('balance', '');
        }
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setIsSubmitting(true);
            setSubmitting(true);
            const entryValue = isEditing ? values.entry : `AG ${entryNumber}/${totalEntries}`;

            const submitData = {
                agent_name: values.agent_name,
                date: values.date,
                employee: values.employee,
                entry: entryValue,
                detail: values.detail,
            };

            // Handle opening balance mode
            if (hideFields && !isEditing) {
                const balanceValue = parseFloat(values.balance) || 0;
                if (balanceValue >= 0) {
                    submitData.credit = balanceValue;
                    submitData.debit = 0;
                } else {
                    submitData.credit = 0;
                    submitData.debit = Math.abs(balanceValue);
                }
                submitData.paid_cash = 0;
                submitData.paid_bank = 0;
            } else {
                // Normal mode
                submitData.credit = parseFloat(values.credit) || 0;
                submitData.debit = parseFloat(values.debit) || 0;
                submitData.paid_cash = parseFloat(values.paid_cash) || 0;
                submitData.paid_bank = parseFloat(values.paid_bank) || 0;
            }

            let response;
            if (isEditing) {
                response = await axios.put(`${BASE_URL}/agent/${editingEntry.id}`, submitData);
            } else {
                response = await axios.post(`${BASE_URL}/agent`, submitData);
                if (response.data.status === 'success') {
                    await incrementFormEntry('agent', entryNumber);
                }
            }

            if (response.data.status === 'success') {
                console.log(`Agent entry ${isEditing ? 'updated' : 'created'} successfully:`); 
                resetForm();
                setHideFields(false);
                onSubmitSuccess();
            }
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'submitting'} form:`, error);
            alert(`Failed to ${isEditing ? 'update' : 'save'} agent entry: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-2xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    {isEditing ? 'UPDATE AGENT ENTRY' : 'AGENT FORM'}
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                
                <Formik 
                    initialValues={initialValues} 
                    validationSchema={validationSchema} 
                    onSubmit={onSubmit}
                    enableReinitialize={true}
                    context={{ hideFields }}
                >
                    {formik => (
                        <Form className="flex-1 overflow-hidden p-6">
                            {/* Opening Balance Checkbox */}
                            <div className="w-full mb-4">
                                {!isEditing && (
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={hideFields}
                                            onChange={(e) => handleCheckboxChange(e, formik.setFieldValue)}
                                            className="mr-2"
                                        />
                                        <span className="font-medium">Opening Balance</span>
                                    </label>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Agent Name with Dropdown and Add Button */}
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Agent Name</label>
                                    <div className="flex items-center gap-2">
                                        <Field name="agent_name">
                                            {({ field }) => (
                                                <select
                                                    {...field}
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                    disabled={isLoadingNames}
                                                >
                                                    <option value="">
                                                        {isLoadingNames ? 'Loading...' : 'Select Agent Name'}
                                                    </option>
                                                    {agentNames.map((name, index) => (
                                                        <option key={index} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </Field>
                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                                                title="Add New Agent Name"
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        )}
                                    </div>
                                    <ErrorMessage name="agent_name" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Date</label>
                                    <Field
                                        type="date"
                                        name="date"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Employee</label>
                                    <Field
                                        type="text"
                                        name="employee"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled
                                    />
                                    <ErrorMessage name="employee" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Entry</label>
                                    <Field
                                        type="text"
                                        name="entry"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                                        disabled
                                        readOnly
                                        value={isEditing ? formik.values.entry : `AG ${entryNumber}/${totalEntries}`}
                                    />
                                    <ErrorMessage name="entry" component="div" className="text-red-500 text-sm mt-1" />
                                </div>  

                                <div className="w-full">
                                    <label className="block font-medium mb-1">Detail</label>
                                    <Field
                                        type="text"
                                        name="detail"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="detail" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {/* Conditional Fields based on Opening Balance checkbox */}
                                {!hideFields ? (
                                    <>
                                        <div className="w-full sm:w-[calc(50%-10px)]">
                                            <label className="block font-medium mb-1">Credit</label>
                                            <Field
                                                type="number"
                                                name="credit"
                                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                            <ErrorMessage name="credit" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="w-full sm:w-[calc(50%-10px)]">
                                            <label className="block font-medium mb-1">Debit</label>
                                            <Field
                                                type="number"
                                                name="debit"
                                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                            <ErrorMessage name="debit" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="w-full sm:w-[calc(50%-10px)]">
                                            <label className="block font-medium mb-1">Paid Cash</label>
                                            <Field
                                                type="number"
                                                name="paid_cash"
                                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                            <ErrorMessage name="paid_cash" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>

                                        <div className="w-full sm:w-[calc(50%-10px)]">
                                            <label className="block font-medium mb-1">Paid Bank</label>
                                            <Field
                                                type="number"
                                                name="paid_bank"
                                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                            <ErrorMessage name="paid_bank" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full sm:w-[calc(50%-10px)]">
                                        <label className="block font-medium mb-1">Balance</label>
                                        <Field
                                            type="number"
                                            name="balance"
                                            className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <ErrorMessage name="balance" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-10 flex justify-center">
                                <button
                                    type="submit"
                                    className="w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                                    disabled={isSubmitting || formik.isSubmitting}
                                >
                                    {(isSubmitting || formik.isSubmitting) && <ButtonSpinner />}
                                    {isEditing ? 'Update' : 'Submit'}
                                </button>
                                <button
                                    type="button"
                                    className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                                    onClick={onCancel}
                                    disabled={isSubmitting || formik.isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>

                {/* Agent Name Modal - Only show when not editing */}
                {!isEditing && (
                    <AgentNameModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onAgentAdded={handleAgentAdded}
                    />
                )}
            </div>
        </div>
    );
};

export default AgentForm;