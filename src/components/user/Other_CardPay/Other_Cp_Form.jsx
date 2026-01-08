import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

// --- Auto-calculation component ---
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const cardAmount = parseFloat(values.card_amount) || 0;

        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining.toFixed(2));

        const profit = receivable - cardAmount;
        setFieldValue('profit', profit ? profit.toFixed(2) : '');
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        setFieldValue
    ]);

    return null;
};

const Other_Cp_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [entryNumber, setEntryNumber] = useState(1);
    const [totalEntries, setTotalEntries] = useState(1);
    const [agentNames, setAgentNames] = useState([]);
    const [isLoadingCounts, setIsLoadingCounts] = useState(true);

    // Helper: format date string to YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingCounts(true);
            try {
                const [countsRes, agentRes] = await Promise.all([
                    fetchEntryCounts(),
                    axios.get(`${BASE_URL}/agent-names/existing`),
                ]);

                // Get Other CP counts for current_count
                const otherCpCounts = countsRes?.find(c => c.form_type === 'other-cp');
                // Get global counts for global_count (total across all forms)
                const globalCounts = countsRes?.find(c => c.form_type === 'global');

                console.log('Fetched counts:', countsRes);
                console.log('Found other-cp counts:', otherCpCounts);
                console.log('Found global counts:', globalCounts);

                if (otherCpCounts && globalCounts) {
                    console.log('Other CP counts:', {
                        current_count: otherCpCounts.current_count,
                        global_count: globalCounts.global_count,
                        editEntry: !!editEntry
                    });

                    if (!editEntry) {
                        // For new entry: other-cp current_count + 1 / global global_count + 1
                        const newEntryNumber = otherCpCounts.current_count + 1;
                        const newTotalEntries = globalCounts.global_count + 1;
                        setEntryNumber(newEntryNumber);
                        setTotalEntries(newTotalEntries);
                        console.log('Setting new entry number:', newEntryNumber, '/', newTotalEntries);
                    } else {
                        // For edit mode, parse the existing entry number
                        const match = editEntry.entry?.match(/OCP (\d+)\/(\d+)/);
                        if (match) {
                            const parsedEntryNum = parseInt(match[1]);
                            const parsedTotalNum = parseInt(match[2]);
                            setEntryNumber(parsedEntryNum);
                            setTotalEntries(parsedTotalNum);
                            console.log('Edit mode - parsed:', parsedEntryNum, '/', parsedTotalNum);
                        } else {
                            // Fallback for edit mode
                            setEntryNumber(otherCpCounts.current_count);
                            setTotalEntries(globalCounts.global_count);
                        }
                    }
                } else {
                    console.log('No counts found, using defaults');
                    setEntryNumber(1);
                    setTotalEntries(1);
                }

                // Load agent names
                if (agentRes.data?.status === 'success') {
                    setAgentNames(agentRes.data.agentNames || []);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                setEntryNumber(1);
                setTotalEntries(1);
            } finally {
                setIsLoadingCounts(false);
            }
        };

        loadInitialData();
    }, [BASE_URL, editEntry]);

    // Generate entry string based on entryNumber and totalEntries
    const generateEntryString = () => {
        return `OCP ${entryNumber}/${totalEntries}`;
    };

    // Memoized initial values
    const initialValues = useMemo(() => {
        console.log('Generating initial values with:', {
            entryNumber,
            totalEntries,
            entryString: generateEntryString(),
            editEntry: !!editEntry
        });

        const base = {
            date: new Date().toISOString().split('T')[0],
            entry: generateEntryString(),
            employee: user?.username || '',
            detail: '',
            card_payment: 'Card Payment',
            card_amount: '',
            receivable_amount: '',
            paid_cash: '',
            paid_from_bank: '',
            paid_in_bank: '',
            agent_name: '',
            profit: '',
            remaining_amount: '0'
        };

        if (editEntry) {
            return {
                ...base,
                date: formatDate(editEntry.date) || new Date().toISOString().split('T')[0],
                entry: editEntry.entry || generateEntryString(),
                employee: editEntry.employee || user?.username || '',
                detail: editEntry.detail || '',
                card_payment: editEntry.card_payment || 'Card Payment',
                card_amount: editEntry.card_amount || '',
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_from_bank: editEntry.paid_from_bank || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                agent_name: editEntry.agent_name || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '0'
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object({
        date: Yup.date().required('Date is required').typeError('Invalid date'),
        entry: Yup.string().required('Entry is required'),
        employee: Yup.string().required('Employee name is required'),
        detail: Yup.string().required('Detail is required'),
        card_payment: Yup.string().required('Card payment is required'),
        card_amount: Yup.number().required('Card amount is required').min(0, 'Amount must be positive').typeError('Must be a number'),
        receivable_amount: Yup.number().notRequired().typeError('Must be a number'),
        paid_cash: Yup.number().notRequired().typeError('Must be a number'),
        paid_from_bank: Yup.string().notRequired(),
        paid_in_bank: Yup.number().notRequired().typeError('Must be a number'),
        agent_name: Yup.string().notRequired(),
        profit: Yup.number().typeError('Profit must be a number').notRequired(),
        remaining_amount: Yup.number().typeError('Remaining Amount must be a number').notRequired()
    });

    const cardPaymentOptions = [
        'Card Payment'
    ];

    const bankOptions = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        console.log('Submitting form with entry:', values.entry);

        const agentName = values.agent_name || '';
        const referenceToStore = values.agent_name ? '' : (values.reference || '');
        const detail = `${agentName} / ${referenceToStore}`;

        const requestData = {
            date: values.date,
            entry: values.entry,
            employee: values.employee,
            detail: detail,
            card_payment: values.card_payment,
            card_amount: parseFloat(values.card_amount) || 0,
            receivable_amount: parseFloat(values.receivable_amount) || 0,
            paid_cash: parseFloat(values.paid_cash) || 0,
            paid_from_bank: values.paid_from_bank || null,
            paid_in_bank: parseFloat(values.paid_in_bank) || 0,
            agent_name: values.agent_name || null,
            profit: parseFloat(values.profit) || 0,
            remaining_amount: parseFloat(values.remaining_amount) || 0
        };

        try {
            const url = editEntry ? `${BASE_URL}/other-cp/${editEntry.id}` : `${BASE_URL}/other-cp`;
            const method = editEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Refresh entry counts after successful submission
            const counts = await fetchEntryCounts();
            if (!editEntry && counts) {
                // FIXED: use 'other-cp' (with hyphen)
                const otherCpCounts = counts.find(c => c.form_type === 'other-cp');
                if (otherCpCounts) {
                    setEntryNumber(otherCpCounts.current_count + 1);
                    setTotalEntries(otherCpCounts.global_count + 1);
                    console.log('Updated entry numbers after submission:', otherCpCounts.current_count + 1, '/', otherCpCounts.global_count + 1);
                }
            }

            // Bank transaction
            if (parseFloat(values.paid_in_bank) > 0 && values.paid_from_bank) {
                await axios.post(`${BASE_URL}/accounts`, {
                    bank_name: values.paid_from_bank,
                    employee_name: values.employee,
                    detail: detail,
                    credit: parseFloat(values.paid_in_bank),
                    debit: 0,
                    date: values.date,
                    entry: values.entry,
                });
            }

            // Agent transaction
            if (values.agent_name) {
                await axios.post(`${BASE_URL}/agent`, {
                    agent_name: values.agent_name,
                    employee: values.employee,
                    detail: detail,
                    receivable_amount: parseFloat(values.receivable_amount),
                    paid_cash: parseFloat(values.paid_cash),
                    paid_bank: parseFloat(values.paid_in_bank),
                    credit: parseFloat(values.remaining_amount),
                    date: values.date,
                    entry: values.entry,
                    bank_title: values.paid_from_bank || null,
                    debit: null
                });
            }

            resetForm();
            onSubmitSuccess();
        } catch (error) {
            console.error('Submission error:', error);
            setErrors({ general: error.message || 'Failed to submit form.' });
        } finally {
            setSubmitting(false);
        }
    };

    const formVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
    };

    const formFields = [
        { name: 'date', label: 'Date', type: 'date', placeholder: '', icon: 'calendar' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'employee', label: 'Employee', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'detail', label: 'Detail', type: 'text', placeholder: 'Enter detail', icon: 'info-circle' },
        { name: 'card_payment', label: 'Card Payment', type: 'select', options: cardPaymentOptions, placeholder: 'Select card payment type', icon: 'credit-card' },
        { name: 'card_amount', label: 'Card Amount', type: 'number', placeholder: 'Enter card amount', icon: 'dollar-sign' }
    ];

    const section3Fields = [
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd', readOnly: !!editEntry },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave', readOnly: !!editEntry },
        { name: 'paid_from_bank', label: 'Bank Title', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment', icon: 'university', readOnly: !!editEntry },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Auto-calculated', icon: 'chart-line', readOnly: !!editEntry },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Auto-calculated', icon: 'balance-scale', readOnly: true }
    ];

    const renderField = (field) => (
        <motion.div key={field.name} className="mb-4" variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {!field.readOnly && formFields.includes(field) && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {field.type === 'select' ? (
                    <Field
                        as="select"
                        name={field.name}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled={field.readOnly}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Field>
                ) : (
                    <Field
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 ${field.readOnly ? 'bg-gray-100' : ''}`}
                        readOnly={field.readOnly}
                    />
                )}
                <ErrorMessage name={field.name} component="p" className="mt-1 text-sm text-red-500">
                    {(msg) => <span className="flex items-center text-red-500">{msg}</span>}
                </ErrorMessage>
            </div>
        </motion.div>
    );

    // Show loading state while fetching entry counts
    if (isLoadingCounts) {
        return (
            <div className="max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin text-2xl text-purple-600 mb-2"></i>
                        <p>Loading entry number...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-8 rounded-t-xl">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <motion.h2
                            className="text-2xl font-bold text-black flex items-center"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <i className="fas fa-credit-card mr-3"></i>
                            {editEntry ? 'Update Other CP Entry' : 'New Other CP Entry'}
                        </motion.h2>
                        <motion.p className="text-indigo-600 mt-1">
                            Please fill in the card payment details
                        </motion.p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-black hover:text-gray-600 ml-4"
                    >
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>

            <div className="px-8 py-8">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                >
                    {({ isSubmitting, errors, values }) => (
                        <Form>
                            <AutoCalculate />
                            <motion.div
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                            >
                                {formFields.map(renderField)}
                            </motion.div>

                            <div className="mt-8 mb-4">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Details</h3>
                                <motion.div
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                                >
                                    {section3Fields.map(renderField)}
                                </motion.div>
                            </div>

                            {errors.general && (
                                <div className="text-red-600 mt-4 p-3 bg-red-100 border border-red-200 rounded-md flex items-center">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    {errors.general}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <ButtonSpinner />}
                                    <i className="fas fa-check mr-2"></i>
                                    {editEntry ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Other_Cp_Form