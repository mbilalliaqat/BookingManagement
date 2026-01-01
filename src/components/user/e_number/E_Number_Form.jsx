import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

const E_Number_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    };

    const initialValues = useMemo(() => {
        const base = {
            date: new Date().toISOString().split('T')[0],
            employee: user?.username || '',
            entryNo: `EN ${entryNumber}/${totalEntries}`,
            fileNo: '',
            name: '', // Add name to initial values
            visaId: '',
            reference: '',
            passportNo: '',
            mobileNo: '',
            payFromBankCard: 'Card Payment',
            card_amount: '',
        };

        if (editEntry) {
            return {
                ...base,
                date: formatDate(editEntry.date) || new Date().toISOString().split('T')[0],
                employee: editEntry.employee || user?.username || '',
                entryNo: editEntry.entryNo || `EN ${entryNumber}/${totalEntries}`,
                fileNo: editEntry.fileNo || '',
                name: editEntry.name || '', // Add name to editEntry
                visaId: editEntry.visaId || '',
                reference: editEntry.reference || '',
                passportNo: editEntry.passportNo || '',
                mobileNo: editEntry.mobileNo || '',
                payFromBankCard: editEntry.payFromBankCard || '',
                card_amount: editEntry.card_amount || '',
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object({
        date: Yup.date().required('Date is required'),
        employee: Yup.string().required('Employee is required'),
        entryNo: Yup.string().required('Entry No is required'),
        fileNo: Yup.string().required('File Number is required'),
        name: Yup.string().required('Name is required'), // Add validation for name
        visaId: Yup.string().required('Visa ID is required'),
        reference: Yup.string().required('Reference is required'),
        passportNo: Yup.string().required('Passport No is required'),
        mobileNo: Yup.string().required('Mobile No is required'),
        payFromBankCard: Yup.string().required('Pay from bank card is required'),
        card_amount: Yup.number().required('Card Amount is required').typeError('Card Amount must be a number'),
    });

    const bankOptions = [
        { value: "Card Payment", label: "Card Payment" },

    ];

    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                // Get e-number specific count for current_count
                const eNumberCounts = counts.find(c => c.form_type === 'e-number');
                // Get global count for total entries across all forms
                const globalCounts = counts.find(c => c.form_type === 'global');

                if (eNumberCounts && globalCounts) {
                    setEntryNumber(eNumberCounts.current_count + 1);
                    setTotalEntries(globalCounts.global_count + 1); // Use global count here
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
            const url = editEntry ? `${BASE_URL}/e-numbers/${editEntry.id}` : `${BASE_URL}/e-numbers`;
            const method = editEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            if (!editEntry) {
                const counts = await fetchEntryCounts();

                if (parseFloat(values.card_amount) > 0) {
                    // Create a bank detail entry when a new e-number is created
                    const bankCounts = counts.find(c => c.form_type === 'bank-detail');
                    const globalCounts = counts.find(c => c.form_type === 'global');

                    const bankEntryNumber = bankCounts ? bankCounts.current_count + 1 : 1;
                    const bankTotalEntries = globalCounts ? globalCounts.global_count + 1 : 1;

                    const bankDetailData = {
                        date: values.date,
                        entry: `BD ${bankEntryNumber}/${bankTotalEntries}`,
                        employee: values.employee,
                        detail: `E-Number payment for file ${values.fileNo}`,
                        credit: 0,  // No money coming in
                        debit: parseFloat(values.card_amount) || 0,  // Money going out
                    };

                    const bankDetailResponse = await fetch(`${BASE_URL}/bank-details`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bankDetailData),
                    });

                    if (!bankDetailResponse.ok) {
                        const errorData = await bankDetailResponse.json();
                        throw new Error(`Failed to create bank detail entry: ${errorData.message || 'Unknown error'}`);
                    }
                }

                // Refresh counts after submission
                const updatedCounts = await fetchEntryCounts();
                const eNumberCounts = updatedCounts.find(c => c.form_type === 'e-number');
                const globalCounts = updatedCounts.find(c => c.form_type === 'global');

                if (eNumberCounts && globalCounts) {
                    setEntryNumber(eNumberCounts.current_count + 1);
                    setTotalEntries(globalCounts.global_count + 1);
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
        { name: 'date', label: 'Date', type: 'date', placeholder: '', icon: 'calendar-check' },
        { name: 'employee', label: 'Employee', type: 'text', placeholder: 'Employee name', icon: 'user', readOnly: true },
        { name: 'entryNo', label: 'Entry No', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'fileNo', label: 'File Number', type: 'text', placeholder: 'Enter file number', icon: 'folder' },
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter name', icon: 'user' }, // Add name field
        { name: 'visaId', label: 'Visa ID', type: 'text', placeholder: 'Enter visa ID', icon: 'id-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'passportNo', label: 'Passport No', type: 'text', placeholder: 'Enter passport number', icon: 'passport' },
        { name: 'mobileNo', label: 'Mobile No', type: 'text', placeholder: 'Enter mobile number', icon: 'phone' },
        { name: 'payFromBankCard', label: 'Pay from Bank Card', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank card', icon: 'credit-card' },
        { name: 'card_amount', label: 'Card Amount', type: 'number', placeholder: 'Enter Card Amount', icon: 'dollar-sign' },
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
                            {editEntry ? 'Update E-Number' : 'New E-Number'}
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



            <div className="px-8 pb-8 pt-6">
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
                                <div className="text-red-600 mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                                    {errors.general}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-purple-600 text-white rounded-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <ButtonSpinner />}
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

export default E_Number_Form;