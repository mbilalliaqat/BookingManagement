import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';

// Auto-calculation component for GAMCA token form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        // Get values as numbers (defaulting to 0 if empty or NaN)
        const receivable = parseInt(values.receivable_amount) || 0;
        const cashPaid = parseInt(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        
        // Calculate remaining amount
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);
        
        // Calculate profit (assuming some cost basis, can be modified as needed)
        // For now, just setting profit as a field that can be manually entered
        // You can add automatic calculation logic here if needed
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        setFieldValue
    ]);
    
    return null;
};

const GamcaToken_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);

    const [formInitialValues, setFormInitialValues] = useState({
        employee_name: user?.username || '',
        customer_add: '',
        reference: '',
        country: '',
        // Structured passport fields
        passengerTitle: '',
        passengerFirstName: '',
        passengerLastName: '',
        passengerDob: '',
        passengerNationality: '',
        documentType: 'Passport',
        documentNo: '',
        documentExpiry: '',
        documentIssueCountry: '',
        receivable_amount: '',
        paid_cash: '',
        paid_from_bank:'',
        paid_in_bank: '',
        profit: '',
        remaining_amount: '0'
    });

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        reference: Yup.string().required('Reference is required'),
        country: Yup.string().required('Country is required'),
        // Validation for passport fields
        passengerTitle: Yup.string().required('Title is required'),
        passengerFirstName: Yup.string().required('First Name is required'),
        passengerLastName: Yup.string().required('Last Name is required'),
        passengerDob: Yup.date().required('Date of Birth is required').typeError('Invalid date'),
        passengerNationality: Yup.string().required('Nationality is required'),
        documentType: Yup.string().required('Document Type is required'),
        documentNo: Yup.string().required('Document Number is required'),
        documentExpiry: Yup.date().required('Expiry Date is required').typeError('Invalid date'),
        documentIssueCountry: Yup.string().required('Issue Country is required'),
        receivable_amount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        paid_cash: Yup.number().required('Paid Cash is required').typeError('Paid Cash must be a number'),
        paid_from_bank: Yup.string().required('Bank Title is required'),
        paid_in_bank: Yup.number().required('Paid In Bank is required').typeError('Paid_in_bank must be a number'),
        profit: Yup.number().required('Profit is required').typeError('Profit must be a number'),
        remaining_amount: Yup.number()
    });

    useEffect(() => {
        if (editEntry) {
            // Parse passport details if it's stored as a JSON string or structured object
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passport_detail === 'string') {
                    // Try to parse as JSON first
                    try {
                        parsedPassportDetails = JSON.parse(editEntry.passport_detail);
                    } catch {
                        // If not JSON, it's probably a simple string, so leave passport fields empty
                    }
                } else if (typeof editEntry.passport_detail === 'object' && editEntry.passport_detail !== null) {
                    parsedPassportDetails = editEntry.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            // Format dates properly for the form fields
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
            };

            const newValues = {
                employee_name: editEntry.employee_name || user?.username || '',
                
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                country: editEntry.country || '',
                
                // Map passport details from parsed object
                passengerTitle: parsedPassportDetails.title || '',
                passengerFirstName: parsedPassportDetails.firstName || '',
                passengerLastName: parsedPassportDetails.lastName || '',
                passengerDob: formatDate(parsedPassportDetails.dob),
                passengerNationality: parsedPassportDetails.nationality || '',
                documentType: parsedPassportDetails.documentType || 'Passport',
                documentNo: parsedPassportDetails.documentNo || '',
                documentExpiry: formatDate(parsedPassportDetails.documentExpiry),
                documentIssueCountry: parsedPassportDetails.issueCountry || '',
                
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_from_bank:editEntry.paid_from_bank || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || ''
            };
            
            setFormInitialValues(newValues);
            console.log("Loaded edit values:", newValues);
        }
    }, [editEntry, user]);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        // Create a structured passport details object
        const passportDetail = JSON.stringify({
            title: values.passengerTitle,
            firstName: values.passengerFirstName,
            lastName: values.passengerLastName,
            dob: values.passengerDob,
            nationality: values.passengerNationality,
            documentType: values.documentType,
            documentNo: values.documentNo,
            documentExpiry: values.documentExpiry,
            issueCountry: values.documentIssueCountry,
        });

        const requestData = {
            employee_name: values.employee_name,
            customer_add: values.customer_add,
            reference: values.reference,
            country: values.country,
            passport_detail: passportDetail,
            receivable_amount: parseInt(values.receivable_amount),
            paid_cash: parseInt(values.paid_cash),
            paid_from_bank:values.paid_from_bank,
            paid_in_bank: parseInt(values.paid_in_bank),
            profit: parseInt(values.profit),
            remaining_amount: parseInt(values.remaining_amount)
        };

        try {
            const url = editEntry ? `${BASE_URL}/gamca-token/${editEntry.id}` : `${BASE_URL}/gamca-token`;
            const method = editEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();
            resetForm();
            onSubmitSuccess();
        } catch (error) {
            console.error('Error:', error);
            setErrors({ general: 'Failed to submit form. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

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
        { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country', icon: 'globe' },
    ];

    // Passport details section
    const section2Fields = [
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Dr'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        { name: 'passengerNationality', label: 'Nationality', type: 'text', placeholder: 'Enter nationality', icon: 'flag' },
        { name: 'documentType', label: 'Document Type', type: 'select', options: ['Passport'], placeholder: 'Select document type', icon: 'id-card' },
        { name: 'documentNo', label: 'Document No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
        { name: 'documentIssueCountry', label: 'Issue Country', type: 'text', placeholder: 'Enter issue country', icon: 'globe' },
    ];

    const section3Fields = [
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd' },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'paid_from_bank', label: 'Paid From Bank', type: 'text', placeholder: 'Enter bank title' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment details', icon: 'university' },
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
                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                        className={`w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                            field.readOnly ? 'bg-gray-100' : ''
                        }`}
                        disabled={field.readOnly}
                        readOnly={field.readOnly}
                    />
                )}
                <ErrorMessage 
                    name={field.name} 
                    component="p" 
                    className="mt-1 text-sm text-red-500 flex items-center"
                >
                    {(msg) => (
                        <span className="flex items-center">
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
                    <i className="fas fa-id-card mr-3"></i>
                    {editEntry ? 'Update GAMCA Token' : 'New GAMCA Token'}
                </motion.h2>
                <motion.p 
                    className="text-blue-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Please fill in the GAMCA token details
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
                                    {step === 1 ? 'Basic Info' : step === 2 ? 'Passport Details' : 'Payment Details'}
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
                    initialValues={formInitialValues}
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
                                    className="text-red-600 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {errors.general}
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
                                    
                                    {activeSection < 3 ? (
                                        <motion.button
                                            
                                        >
                                            
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            type="submit"
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700  flex items-center shadow-md hover:shadow-lg transition-all"
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

export default GamcaToken_Form;