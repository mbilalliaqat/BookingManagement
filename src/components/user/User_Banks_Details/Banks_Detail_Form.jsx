import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

// --- Auto-calculation component for balance ---
const AutoCalculateBalance = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        const credit = parseFloat(values.credit) || 0;
        const debit = parseFloat(values.debit) || 0;
        
        const balance = credit - debit;
        setFieldValue('balance', balance.toFixed(2));
    }, [values.credit, values.debit, setFieldValue]);
    
    return null;
};

const Banks_Detail_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    };

    const initialValues = useMemo(() => {
        const base = {
            bank_name: '',
            date: new Date().toISOString().split('T')[0],
            entry: `BD ${entryNumber}/${totalEntries}`,
            employee: user?.username || '',
            detail: '',
            credit: '',
            debit: '',
            balance: '0',
        };

        if (editEntry) {
            return {
                ...base,
                bank_name: editEntry.bank_name || '',
                date: formatDate(editEntry.date) || new Date().toISOString().split('T')[0],
                entry: editEntry.entry || `BD ${entryNumber}/${totalEntries}`,
                employee: editEntry.employee || user?.username || '',
                detail: editEntry.detail || '',
                credit: editEntry.credit || '',
                debit: editEntry.debit || '',
                balance: editEntry.balance || '0',
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object({
        bank_name: Yup.string().required('Bank Name is required'),
        date: Yup.date().required('Date is required').typeError('Invalid date'),
        entry: Yup.string().required('Entry is required'),
        employee: Yup.string().required('Employee is required'),
        detail: Yup.string().required('Detail is required'),
        credit: Yup.number().min(0, 'Credit must be positive').typeError('Must be a number').notRequired(),
        debit: Yup.number().min(0, 'Debit must be positive').typeError('Must be a number').notRequired(),
        balance: Yup.number().typeError('Balance must be a number').notRequired(),
    });

    const bankOptions = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const bankCounts = counts.find(c => c.form_type === 'bank-detail');
                if (bankCounts) {
                    setEntryNumber(bankCounts.current_count + 1);
                    setTotalEntries(bankCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
            }
        };
        getCounts();
    }, []);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
            const requestData = {
                bank_name: values.bank_name,
                date: values.date,
                entry: values.entry,
                employee: values.employee,
                detail: values.detail,
                credit: parseFloat(values.credit) || 0,
                debit: parseFloat(values.debit) || 0,
                balance: parseFloat(values.balance) || 0,
            };

            const url = editEntry 
                ? `${BASE_URL}/bank-details/${editEntry.id}` 
                : `${BASE_URL}/bank-details`;
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

            if (!editEntry) {
                const counts = await fetchEntryCounts();
                const bankCounts = counts.find(c => c.form_type === 'bank-detail');
                if (bankCounts) {
                    setEntryNumber(bankCounts.current_count + 1);
                    setTotalEntries(bankCounts.global_count);
                }
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

    // Section 1: Bank & Entry Information
    const section1Fields = [
        { name: 'bank_name', label: 'Bank Name', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank name', icon: 'university' },
        { name: 'date', label: 'Date', type: 'date', placeholder: '', icon: 'calendar-check' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'employee', label: 'Employee', type: 'text', placeholder: 'Employee name', icon: 'user', readOnly: true },
    ];

    // Section 2: Transaction Details
    const section2Fields = [
        { name: 'detail', label: 'Detail', type: 'textarea', placeholder: 'Enter transaction details', icon: 'file-alt' },
        { name: 'credit', label: 'Credit', type: 'number', placeholder: 'Enter credit amount', icon: 'arrow-down' },
        { name: 'debit', label: 'Debit', type: 'number', placeholder: 'Enter debit amount', icon: 'arrow-up' },
        { name: 'balance', label: 'Balance', type: 'number', placeholder: 'Auto-calculated', icon: 'balance-scale', readOnly: true },
    ];

    const renderField = (field) => (
        <motion.div 
            key={field.name} 
            className={`mb-4 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`} 
            variants={itemVariants}
        >
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} <span className="text-red-500">*</span>
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
                ) : field.type === 'textarea' ? (
                    <Field
                        as="textarea"
                        name={field.name}
                        placeholder={field.placeholder}
                        rows="4"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
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
                    {(msg) => <span>{msg}</span>}
                </ErrorMessage>
            </div>
        </motion.div>
    );

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
                            {editEntry ? 'Update Bank Detail' : 'New Bank Detail'}
                        </motion.h2>
                        <motion.p className="text-indigo-600 mt-1">Please fill in the details</motion.p>
                    </div>
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="text-black hover:text-gray-600 ml-4"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2].map((step) => (
                        <button 
                            key={step} 
                            onClick={() => setActiveSection(step)} 
                            className={`flex-1 ${step === activeSection ? 'text-purple-600' : 'text-gray-400'}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center ${step === activeSection ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {step < activeSection ? '✓' : <span className="font-medium">{step}</span>}
                                </div>
                                <span className="text-sm">
                                    {step === 1 ? 'Bank & Entry Info' : 'Transaction Details'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-8 pb-8">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                >
                    {({ isSubmitting, errors }) => (
                        <Form>
                            <AutoCalculateBalance />
                            <motion.div
                                key={`section-${activeSection}`}
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                            >
                                {activeSection === 1 && section1Fields.map(renderField)}
                                {activeSection === 2 && section2Fields.map(renderField)}
                            </motion.div>

                            {errors.general && (
                                <div className="text-red-600 mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                                    {errors.general}
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-4 border-t">
                                <div>
                                    {activeSection > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setActiveSection(activeSection - 1)} 
                                            className="px-4 py-2 text-indigo-600"
                                        >
                                            Back
                                        </button>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button 
                                        type="button" 
                                        onClick={onCancel} 
                                        className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50" 
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    {activeSection < 2 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setActiveSection(activeSection + 1)} 
                                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
                                        >
                                            Next
                                        </button>
                                    )}
                                    {activeSection === 2 && (
                                        <button 
                                            type="submit" 
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg" 
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting && <ButtonSpinner />}
                                            {editEntry ? 'Update' : 'Submit'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Banks_Detail_Form;