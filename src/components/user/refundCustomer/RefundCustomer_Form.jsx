import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

// Auto-calculation component for refund customer form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
         const totalAmount = parseFloat(values.total_amount) || 0;
        const returnFromVendor = parseFloat(values.return_from_vendor) || 0;
        const officeServiceCharges = parseFloat(values.office_service_charges) || 0;
        const paidCash = parseFloat(values.paid_cash) || 0;
        const paidInBank = parseFloat(values.paid_in_bank) || 0;
        
        // Calculate remaining amount: return from vendor - office service charges
        const remaining = totalAmount - returnFromVendor - officeServiceCharges;
        setFieldValue('remaining_amount', remaining);
        
        // Calculate balance: remaining amount - paid cash - paid in bank
        const balance = remaining - paidCash - paidInBank;
        setFieldValue('balance', balance);
        
    }, [
        values.total_amount,
        values.return_from_vendor,
        values.office_service_charges,
        values.paid_cash,
        values.paid_in_bank,
        setFieldValue
    ]);
    
    return null;
};

const RefundCustomer_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [vendorNames, setVendorNames] = useState([]);
       const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    

    const [formInitialValues, setFormInitialValues] = useState({
        employee: user?.username || '',
        name: '',
        entry: '0/0',
        date: new Date().toISOString().split('T')[0],
        passport: '',
        reference: '',
        detail_sector: '',
        total_amount: '',
        vender_name: '',
        return_from_vendor: '',
        office_service_charges: '',
        remaining_amount: '0',
        paid_cash: '',
        paid_in_bank: '',
         bank_title: '',
        balance: '0'
    });

    const validationSchema = Yup.object({
        employee: Yup.string().required('Employee name is required'),
        name: Yup.string().required('Customer name is required'),
        date: Yup.date().required('Date is required').typeError('Invalid date'),
        passport: Yup.string().required('Passport number is required'),
        reference: Yup.string().required('Reference is required'),
        detail_sector: Yup.string().required('Detail sector is required'),
        total_amount: Yup.number().required('Total amount is required').typeError('Total amount must be a number'),
        vender_name: Yup.string().required('Vender Name is required'),
        return_from_vendor: Yup.number().required('Return from vendor is required').typeError('Return from vendor must be a number'),
        office_service_charges: Yup.number().required('Office service charges is required').typeError('Office service charges must be a number'),
        remaining_amount: Yup.number(),
        paid_cash: Yup.number().required('Paid cash is required').typeError('Paid cash must be a number'),
        paid_in_bank: Yup.number().required('Paid in bank is required').typeError('Paid in bank must be a number'),
        bank_title: Yup.string().required('Bank Title is required'),
        balance: Yup.number()
    });

     useEffect(() => {
        const fetchVendorNames = async () => {
            try {
                const response = await fetch(`${BASE_URL}/vender-names/existing`);
                const data = await response.json();
                if (data.status === 'success') {
                    setVendorNames(data.vendorNames || []);
                }
            } catch (error) {
                console.error('Error fetching vendor names:', error);
            }
        };
        fetchVendorNames();
    }, [BASE_URL]);

    useEffect(() => {
        if (editEntry) {
            // Format dates properly for the form fields
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
            };

            const newValues = {
                employee: editEntry.employee || user?.username || '',
                entry: editEntry.entry || `${entryNumber}/${totalEntries}`,
                name: editEntry.name || '',
                date: formatDate(editEntry.date),
                passport: editEntry.passport || '',
                reference: editEntry.reference || '',
                detail_sector: editEntry.detail_sector || '',
                total_amount: editEntry.total_amount || '',
                vender_name: editEntry.vender_name || '',
                return_from_vendor: editEntry.return_from_vendor || '',
                office_service_charges: editEntry.office_service_charges || '',
                remaining_amount: editEntry.remaining_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                bank_title:editEntry.bank_title || '',
                balance: editEntry.balance || ''
            };
            
            setFormInitialValues(newValues);
            console.log("Loaded edit values:", newValues);
        }
    }, [editEntry, user]);

      useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts(); // Assume this function is available
            if (counts) {
                const refundCounts = counts.find(c => c.form_type === 'refund');
                if (refundCounts) {
                    setEntryNumber(refundCounts.current_count + 1);
                    setTotalEntries(refundCounts.global_count + 1);
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

    // Update entry field when entry numbers change
    useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            employee: user?.username || '',
            entry: `${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries, user]);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        const requestData = {
            employee: values.employee,
            entry: values.entry,
            name: values.name,
            date: values.date,
            passport: values.passport,
            reference: values.reference,
            detail_sector: values.detail_sector,
            total_amount: parseFloat(values.total_amount),
            vender_name: values.vender_name,
            return_from_vendor: parseFloat(values.return_from_vendor),
            office_service_charges: parseFloat(values.office_service_charges),
            remaining_amount: parseFloat(values.remaining_amount),
            paid_cash: parseFloat(values.paid_cash),
            paid_in_bank: parseFloat(values.paid_in_bank),
            bank_title:values.bank_title,
            balance: parseFloat(values.balance)
        };

        try {
            const url = editEntry ? `${BASE_URL}/refund-customer/${editEntry.id}` : `${BASE_URL}/refund-customer`;
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

    const bankOptions = [
  { value: "UNITED BANK (ubl1)", label: "UNITED BANK (M ALI RAZA)" },
  { value: "UNITED BANK (ubl2)", label: "UNITED BANK (FAIZAN E RAZA TRAVEL)" },
  { value: "HABIB BANK (HBL1)", label: "HABIB BANK (M ALI RAZA)" },
  { value: "HABIB BANK (HBL2)", label: "HABIB BANK (FAIZAN E RAZA TRAVEL)" },
  { value: "JAZZCASH", label: "JAZZCASH (M ALI RAZA)" },
  { value: "MCB", label: "MCB (FIT MANPOWER)" }
];

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
        { name: 'employee', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
         { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'name', label: 'Customer Name', type: 'text', placeholder: 'Enter customer name', icon: 'user-circle' },
        { name: 'date', label: 'Date', type: 'date', placeholder: 'Enter date', icon: 'calendar-alt' },
        { name: 'passport', label: 'Passport Number', type: 'text', placeholder: 'Enter passport number', icon: 'passport' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'detail_sector', label: 'Detail Sector', type: 'text', placeholder: 'Enter detail sector', icon: 'map-marker-alt' }
    ];

    const section2Fields = [
        { name: 'total_amount', label: 'Total Amount', type: 'number', placeholder: 'Enter total amount', icon: 'dollar-sign' },
         { name: 'vender_name', label: 'Vender Name', type: 'select', options: vendorNames,placeholder: 'Select vendor name',icon: 'store' 
},
        { name: 'return_from_vendor', label: 'Return From Vendor', type: 'number', placeholder: 'Enter return from vendor', icon: 'undo' },
        { name: 'office_service_charges', label: 'Office Service Charges', type: 'number', placeholder: 'Enter office service charges', icon: 'file-invoice-dollar' },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'calculator', readOnly: true },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter paid in bank', icon: 'university' },
         { 
      name: 'bank_title', 
      label: 'Bank Title', 
      type: 'select', 
      options: bankOptions.map(option => option.label), 
      placeholder: 'Select bank title', 
      icon: 'university' 
    },
        { name: 'balance', label: 'Balance', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true }
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
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
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

            
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-8 rounded-t-xl">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <motion.h2 
                            className="text-2xl font-bold text-black flex items-center"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <i className="fas fa-kaaba mr-3"></i>
                           {editEntry ? 'Update Customer Refund' : 'New Customer Refund'}
                        </motion.h2>
                        <motion.p 
                            className="text-indigo-600 mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            Please fill in the details
                        </motion.p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-black hover:text-gray-600 transition-colors ml-4"
                    >
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                </div>
            </div>

           

            {/* Progress tabs */}
            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2].map((step) => (
                        <button
                            key={step}
                            onClick={() => setActiveSection(step)}
                            className={`flex-1 relative ${
                                step < activeSection ? 'text-green-500' : 
                                step === activeSection ? 'text-orange-600' : 'text-gray-400'
                            }`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`
                                    w-10 h-10 flex items-center justify-center rounded-full mb-2
                                    ${step < activeSection ? 'bg-green-100' : 
                                      step === activeSection ? 'bg-orange-100' : 'bg-gray-100'}
                                `}>
                                    {step < activeSection ? (
                                        <i className="fas fa-check"></i>
                                    ) : (
                                        <span className="font-medium">{step}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium">
                                    {step === 1 ? 'Customer Info' : 'Payment Details'}
                                </span>
                            </div>
                            {step < 2 && (
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
                                            className="px-4 py-2 text-orange-600 hover:text-orange-800 transition-colors flex items-center"
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
                                        className="px-5 py-2 border border-gray-700 rounded-lg text-gray-900 hover:bg-orange-600 transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </motion.button>
                                    
                                    {activeSection < 2 ? (
                                        <motion.button
                              
                                        >
                                           
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            type="submit"
                                            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700  flex items-center shadow-md hover:shadow-lg transition-all"
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

export default RefundCustomer_Form;