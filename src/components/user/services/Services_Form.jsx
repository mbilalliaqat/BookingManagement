import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext'; // Ensure this path is correct
import { fetchEntryCounts } from '../../ui/api';


// --- Constants (consider moving to a separate file if used across components) ---
const VISA_TYPES = ['NAVTTC', 'VISIT VISA', 'WORK VISA', 'E-PROTECTOR', 'OTHERS'];

// --- Auto-calculation component for Services form ---
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        // Get values as numbers (defaulting to 0 if empty or NaN)
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        
        // Calculate remaining amount
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        setFieldValue
    ]);
    
    return null;
};

// --- Main Services_Form Component ---
const Services_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
     const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const formatEntry = (entryNumber, totalEntries) => {
    return `se${entryNumber}/t${totalEntries}`;
};

    // Memoize initial values to avoid re-creation on every render
    const initialValues = useMemo(() => {
        const base = {
            user_name: user?.username || '',
             entry: formatEntry(entryNumber, totalEntries),
            customer_add: '',
            booking_date: '',
            specific_detail: '',
            visa_type: '',
            receivable_amount: '',
            paid_cash: '',
            paid_in_bank: '',
          
            profit: '',
            remaining_amount: '0'
        };

        if (editEntry) {
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
            };

            return {
                ...base,
                user_name: editEntry.user_name || user?.username || '',
                 entry: editEntry.entry || formatEntry(entryNumber, totalEntries),
                customer_add: editEntry.customer_add || '',
                booking_date: formatDate(editEntry.booking_date),
                specific_detail: editEntry.specific_detail || '',
                visa_type: editEntry.visa_type || '',
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_in_bank: editEntry.paid_in_bank || '',
              
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '0'
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object().shape({
        user_name: Yup.string().required('User Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        booking_date: Yup.date().required('Booking Date is required').typeError('Invalid date'),
        specific_detail: Yup.string().required('Specific Detail is required'),
        visa_type: Yup.string().required('Visa Type is required').oneOf(VISA_TYPES, 'Invalid Visa Type'),
        receivable_amount: Yup.number().typeError('Receivable Amount must be a number').required('Receivable Amount is required').min(0, 'Amount cannot be negative'),
        paid_cash: Yup.number().typeError('Paid Cash must be a number').required('Paid Cash is required').min(0, 'Amount cannot be negative'),
        paid_in_bank:Yup.number().typeError('Paid_in_bank must be a number').required('Number is required'),
        profit: Yup.number().typeError('Profit must be a number').required('Profit is required'),
        remaining_amount: Yup.number().typeError('Remaining Amount must be a number').min(0, 'Remaining amount cannot be negative')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        const requestData = {
            user_name: values.user_name,
            entry: formatEntry(entryNumber, totalEntries),
            customer_add: values.customer_add,
            booking_date: values.booking_date,
            specific_detail: values.specific_detail,
            visa_type: values.visa_type,
            receivable_amount: parseFloat(values.receivable_amount),
            paid_cash: parseFloat(values.paid_cash),
            paid_in_bank: values.paid_in_bank,
            profit: parseFloat(values.profit),
            remaining_amount: parseFloat(values.remaining_amount)
        };

        try {
            const url = editEntry ? `${BASE_URL}/services/${editEntry.id}` : `${BASE_URL}/services`;
            const method = editEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json(); // Get the response data
            resetForm();
            // Pass the updated entry back to the parent component
            onSubmitSuccess(responseData.service || responseData); 
        } catch (error) {
            console.error('Submission Error:', error);
            setErrors({ general: error.message || 'Failed to submit form. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

     useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const serviceCounts = counts.find(c => c.form_type === 'services');
                if (serviceCounts) {
                    setEntryNumber(serviceCounts.current_count + 1);
                    setTotalEntries(serviceCounts.global_count + 1);
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

    // Animation variants
    const formVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        }
    };

    // Form fields grouped by section
    const section1Fields = [
        { name: 'user_name', label: 'User Name', type: 'text', placeholder: 'Enter user name', icon: 'user', readOnly: true },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true }, 
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: 'Select booking date', icon: 'calendar' },
    ];

    const section2Fields = [
        { name: 'specific_detail', label: 'Specific Detail', type: 'text', placeholder: 'Enter specific details', icon: 'info-circle' },
        { 
            name: 'visa_type', 
            label: 'Visa Type', 
            type: 'select', 
            options: VISA_TYPES, 
            placeholder: 'Select visa type', 
            icon: 'passport' 
        },
    ];

    const section3Fields = [
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd' },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'text', placeholder: 'Enter bank title', icon: 'university' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Enter profit amount', icon: 'chart-line' },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true }
    ];

    const renderField = (field) => (
        <motion.div 
            key={field.name}
            className="mb-4"
            variants={itemVariants}
        >
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={field.name}>
                {field.label}
            </label>
            <div className="relative">
                {field.type === 'select' ? (
                    <Field
                        as="select"
                        id={field.name}
                        name={field.name}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled={field.readOnly}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options && field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Field>
                ) : (
                    <Field
                        id={field.name}
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                            field.readOnly ? 'bg-gray-100' : ''
                        }`}
                        readOnly={field.readOnly}
                        disabled={field.disabled}
                    />
                )}
                <ErrorMessage 
                    name={field.name} 
                    component="p" 
                    className="mt-1 text-sm text-red-500 flex items-center"
                >
                    {(msg) => (
                        <span className="flex items-center text-red-500">
                            <i className="fas fa-exclamation-circle mr-1"></i> {msg}
                        </span>
                    )}
                </ErrorMessage>
            </div>
        </motion.div>
    );

    return (
        <div className="max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-8 rounded-t-xl">
                <motion.h2 
                    className="text-2xl font-bold text-black flex items-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <i className="fas fa-cogs mr-3"></i>
                    {editEntry ? 'Update Service' : 'New Service'}
                </motion.h2>
                <motion.p 
                    className="text-blue-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Please fill in the service details
                </motion.p>
            </div>

            {/* Progress tabs */}
            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((step) => (
                        <button
                            key={step}
                            onClick={() => setActiveSection(step)}
                            className={`flex-1 relative ${
                                step < activeSection ? 'text-green-500' : 
                                step === activeSection ? 'text-purple-600' : 'text-gray-400'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`
                                    w-10 h-10 flex items-center justify-center rounded-full mb-2
                                    ${step < activeSection ? 'bg-green-100' : 
                                      step === activeSection ? 'bg-purple-100' : 'bg-gray-100'}
                                `}>
                                    {step < activeSection ? (
                                        <i className="fas fa-check"></i>
                                    ) : (
                                        <span className="font-medium">{step}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium">
                                    {step === 1 ? 'Basic Info' : step === 2 ? 'Service Details' : 'Payment Details'}
                                </span>
                            </div>
                            {step < 3 && (
                                <div className={`absolute top-5 left-full w-full h-0.5 -ml-2 ${
                                    step < activeSection ? 'bg-green-500' : 'bg-gray-200'
                                }`} style={{ width: "calc(100% - 2rem)" }}></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form content */}
            <div className="px-8 pb-8">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                >
                    {({ isSubmitting, errors }) => ( 
                        <Form>
                            <AutoCalculate />
                            
                            <motion.div
                                key={`section-${activeSection}`}
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                            >
                                {activeSection === 1 && section1Fields.map(renderField)}
                                {activeSection === 2 && section2Fields.map(renderField)}
                                {activeSection === 3 && section3Fields.map(renderField)}
                            </motion.div>

                            {errors.general && (
                                <motion.div 
                                    className="text-red-600 mt-4 p-3 bg-red-100 border border-red-200 rounded-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <i className="fas fa-exclamation-triangle mr-2"></i> {errors.general}
                                </motion.div>
                            )}

                            {/* Navigation buttons */}
                            <motion.div 
                                className="flex justify-between mt-8 pt-4 border-t border-gray-100"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div>
                                    {activeSection > 1 && (
                                        <motion.button
                                            type="button"
                                            onClick={() => setActiveSection(activeSection - 1)}
                                            className="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <i className="fas fa-arrow-left mr-2"></i> Back
                                        </motion.button>
                                    )}
                                </div>
                                
                                <div className="flex space-x-3">
                                    <motion.button
                                        type="button" 
                                        onClick={onCancel}
                                        className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </motion.button>
                                    
                                    {activeSection < 3 && ( 
                                        <motion.button
                                            type="button" 
                                            onClick={() => setActiveSection(activeSection + 1)}
                                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-md hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Next <i className="fas fa-arrow-right ml-2"></i>
                                        </motion.button>
                                    )}

                                    {activeSection === 3 && ( 
                                        <motion.button
                                            type="submit" 
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-md hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting && <ButtonSpinner />}
                                            {editEntry ? 'Update' : 'Submit'} <i className="fas fa-check ml-2"></i>
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Services_Form;