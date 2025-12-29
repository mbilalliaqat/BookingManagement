import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

const Other_Cp_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    // Helper: format date string to YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    };

    // Memoized initial values
    const initialValues = useMemo(() => {
        const base = {
            date: new Date().toISOString().split('T')[0],
            entry: `OCP ${entryNumber}/${totalEntries}`,
            employee: user?.username || '',
            detail: '',
            card_payment: '',
            card_amount: ''
        };

        if (editEntry) {
            return {
                ...base,
                date: formatDate(editEntry.date) || new Date().toISOString().split('T')[0],
                entry: editEntry.entry || `OCP ${entryNumber}/${totalEntries}`,
                employee: editEntry.employee || user?.username || '',
                detail: editEntry.detail || '',
                card_payment: editEntry.card_payment || '',
                card_amount: editEntry.card_amount || ''
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
        card_amount: Yup.number().required('Card amount is required').min(0, 'Amount must be positive').typeError('Must be a number')
    });

    const cardPaymentOptions = [
        'Visa',
        'Mastercard',
        'American Express',
        'Debit Card',
        'Credit Card'
    ];

    // Fetch entry counts
    useEffect(() => {
        let isMounted = true;
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (isMounted && counts) {
                const otherCpCounts = counts.find(c => c.form_type === 'other_cp');
                if (otherCpCounts) {
                    setEntryNumber(otherCpCounts.current_count + 1);
                    setTotalEntries(otherCpCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
            }
        };
        getCounts();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        const requestData = {
            date: values.date,
            entry: values.entry,
            employee: values.employee,
            detail: values.detail,
            card_payment: values.card_payment,
            card_amount: parseFloat(values.card_amount) || 0
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

            // If not editing, refresh entry counts
            if (!editEntry) {
                const counts = await fetchEntryCounts();
                const otherCpCounts = counts.find(c => c.form_type === 'other_cp');
                if (otherCpCounts) {
                    setEntryNumber(otherCpCounts.current_count + 1);
                    setTotalEntries(otherCpCounts.global_count);
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

    const formFields = [
        { name: 'date', label: 'Date', type: 'date', placeholder: '', icon: 'calendar' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'employee', label: 'Employee', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'detail', label: 'Detail', type: 'text', placeholder: 'Enter detail', icon: 'info-circle' },
        { name: 'card_payment', label: 'Card Payment', type: 'select', options: cardPaymentOptions, placeholder: 'Select card payment type', icon: 'credit-card' },
        { name: 'card_amount', label: 'Card Amount', type: 'number', placeholder: 'Enter card amount', icon: 'dollar-sign' }
    ];

    const renderField = (field) => (
        <motion.div key={field.name} className="mb-4" variants={itemVariants}>
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
                    {({ isSubmitting, errors }) => (
                        <Form>
                            <motion.div
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                            >
                                {formFields.map(renderField)}
                            </motion.div>

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

export default Other_Cp_Form;