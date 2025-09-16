import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

const BANK_OPTIONS = [
    { value: "UBL M.A.R", label: "UBL M.A.R" },
    { value: "UBL F.Z", label: "UBL F.Z" },
    { value: "HBL M.A.R", label: "HBL M.A.R" },
    { value: "HBL F.Z", label: "HBL F.Z" },
    { value: "JAZ C", label: "JAZ C" },
    { value: "MCB FIT", label: "MCB FIT" },
    
];

// Auto-calculation component for visa processing form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        // Get values as numbers (defaulting to 0 if empty or NaN)
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const additionalCharges = parseFloat(values.additional_charges) || 0;
        const payForProtector = parseFloat(values.pay_for_protector) || 0;
        
        // Calculate remaining amount
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);
        
        // Calculate profit (receivable - additional charges - pay for protector)
        const profit = receivable - additionalCharges - payForProtector;
        setFieldValue('profit', profit);
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.additional_charges,
        values.pay_for_protector,
        setFieldValue
    ]);
    
    return null;
};

const VisaProcessing_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
     const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    

    const [formInitialValues, setFormInitialValues] = useState({
        employee_name: user?.username || '',
        file_number: '',
         entry: '0/0',
        reference: '',
        sponsor_name: '',
        visa_number: '',
        id_number: '',
        embassy: '',
        e_number: '',
        customer_add: '',
        ptn_permission: '',
        embassy_send_date: '',
        embassy_return_date: '',
        protector_date: '',
        expiry_medical_date:'',
        passport_deliver_date: '',
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
        additional_charges: '',
        pay_for_protector: '',
        paid_cash: '',
        bank_title: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: ''
    });

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        // file_number: Yup.string().required('File Number is required'),
        // reference: Yup.string().required('Reference is required'),
        // sponsor_name: Yup.string().required('Sponsor Name is required'),
        // visa_number: Yup.string().required('Visa Number is required'),
        // id_number: Yup.string().required('ID Number is required'),
        // embassy: Yup.string().required('Embassy is required'),
        // e_number: Yup.string().required('E-Number is required'),
        // customer_add: Yup.string().required('Customer Address is required'),
        // ptn_permission: Yup.string().required('PTN/Permission is required'),
        // embassy_send_date: Yup.date().required('Embassy Send Date is required').typeError('Invalid date'),
        // embassy_return_date: Yup.date().required('Embassy Return Date is required').typeError('Invalid date'),
        // protector_date: Yup.date().required('Protector Date is required').typeError('Invalid date'),
        // expiry_medical_date:Yup.date().required('Date is required').typeError('Invalid date'),
        // passport_deliver_date: Yup.date().required('Passport Deliver Date is required').typeError('Invalid date'),
        // // Validation for passport fields
        // passengerTitle: Yup.string().required('Title is required'),
        // passengerFirstName: Yup.string().required('First Name is required'),
        // passengerLastName: Yup.string().required('Last Name is required'),
        // passengerDob: Yup.date().required('Date of Birth is required').typeError('Invalid date'),
        // passengerNationality: Yup.string().required('Nationality is required'),
        // documentType: Yup.string().required('Document Type is required'),
        // documentNo: Yup.string().required('Document Number is required'),
        // documentExpiry: Yup.date().required('Expiry Date is required').typeError('Invalid date'),
        // documentIssueCountry: Yup.string().required('Issue Country is required'),
        // receivable_amount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        // additional_charges: Yup.number().required('Additional Charges is required').typeError('Additional Charges must be a number'),
        // pay_for_protector: Yup.number().required('Pay For Protector is required').typeError('Pay For Protector must be a number'),
        // paid_cash: Yup.number().required('Paid Cash is required').typeError('Paid Cash must be a number'),
        // paid_in_bank: Yup.string().required('Paid In Bank is required'),
        // profit: Yup.number(),
        // remaining_amount: Yup.number()
    });

     useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const visaCounts = counts.find(c => c.form_type === 'visa');
                if (visaCounts) {
                    setEntryNumber(visaCounts.current_count + 1);
                    setTotalEntries(visaCounts.global_count + 1);
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

        setFormInitialValues(prev => ({
            ...prev,
            employee_name: user?.username || '',
            entry: `${entryNumber}/${totalEntries}` // Set initial entry value
        }));
    }, [editEntry, user]);

      useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            entry: `${entryNumber}/${totalEntries}` // Update entry value on state change
        }));
    }, [entryNumber, totalEntries]);

    

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
                file_number: editEntry.file_number || '',
                 entry: editEntry.entry || '0/0',
                reference: editEntry.reference || '',
                sponsor_name: editEntry.sponsor_name || '',
                visa_number: editEntry.visa_number || '',
                id_number: editEntry.id_number || '',
                embassy: editEntry.embassy || '',
                e_number: editEntry.e_number || '',
                customer_add: editEntry.customer_add || '',
                ptn_permission: editEntry.ptn_permission || '',
                embassy_send_date: formatDate(editEntry.embassy_send_date),
                embassy_return_date: formatDate(editEntry.embassy_return_date),
                protector_date: formatDate(editEntry.protector_date),
                expiry_medical_date:formatDate(editEntry.expiry_medical_date),
                passport_deliver_date: formatDate(editEntry.passport_deliver_date),
                
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
                additional_charges: editEntry.additional_charges || '',
                pay_for_protector: editEntry.pay_for_protector || '',
                paid_cash: editEntry.paid_cash || '',
                bank_title: editEntry.bank_title || '',
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
            file_number: values.file_number,
            entry: values.entry,
            reference: values.reference,
            sponsor_name: values.sponsor_name,
            visa_number: values.visa_number,
            id_number: values.id_number,
            embassy: values.embassy,
            passport_detail: passportDetail,
            e_number: values.e_number,
            customer_add: values.customer_add,
            ptn_permission: values.ptn_permission,
            embassy_send_date: new Date(values.embassy_send_date),
            embassy_return_date: new Date(values.embassy_return_date),
            protector_date: new Date(values.protector_date),
            expiry_medical_date:new Date(values.expiry_medical_date),
            passport_deliver_date: new Date(values.passport_deliver_date),
            receivable_amount: parseInt(values.receivable_amount),
            additional_charges: parseInt(values.additional_charges),
            pay_for_protector: parseInt(values.pay_for_protector),
            paid_cash: parseInt(values.paid_cash),
            paid_in_bank: values.paid_in_bank,
            profit: parseInt(values.profit),
            remaining_amount: parseInt(values.remaining_amount)
        };

        try {
            const url = editEntry
                ? `${BASE_URL}/visa-processing/${editEntry.id}`
                : `${BASE_URL}/visa-processing`;
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

            if (parseFloat(values.paid_in_bank) > 0 && values.bank_title) {
                const bankData = {
                    bank_name: values.bank_title,
                    employee_name: values.employee_name,
                    detail: `Visa Sale - ${values.passenger_name} - ${values.reference_name}`,
                    credit: parseFloat(values.paid_in_bank),
                    debit: 0,
                    date: new Date().toISOString().split('T')[0],
                    entry: values.entry,
                };

                try {
                    const response = await axios.post(`${BASE_URL}/accounts`, bankData);
                    if (response.data.status !== 'success') {
                        console.error('Failed to store bank transaction:', response.data.message);
                    }
                } catch (error) {
                    console.error('Error storing bank transaction:', error);
                }
            }

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
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '',icon: 'hashtag', readOnly: true }, 
        { name: 'file_number', label: 'File No.', type: 'text', placeholder: 'Enter file number', icon: 'file-alt' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'sponsor_name', label: 'Sponsor Name', type: 'text', placeholder: 'Enter sponsor name', icon: 'user-tie' },
        { name: 'visa_number', label: 'Visa No.', type: 'text', placeholder: 'Enter visa number', icon: 'id-badge' },
        { name: 'id_number', label: 'ID No.', type: 'text', placeholder: 'Enter ID number', icon: 'id-card' },
        { name: 'embassy', label: 'Embassy', type: 'text', placeholder: 'Enter embassy', icon: 'building' },
        { name: 'e_number', label: 'E-Number', type: 'text', placeholder: 'Enter E-number', icon: 'hashtag' },
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'ptn_permission', label: 'PTN/Permission', type: 'text', placeholder: 'Enter PTN/Permission', icon: 'certificate' },
    ];

    // New section for passport details
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
        { name: 'embassy_send_date', label: 'Embassy Send Date', type: 'date', placeholder: 'Select embassy send date', icon: 'calendar-alt' },
        { name: 'embassy_return_date', label: 'Embassy Return Date', type: 'date', placeholder: 'Select embassy return date', icon: 'calendar-check' },
        { name: 'protector_date', label: 'Protector Date', type: 'date', placeholder: 'Select protector date', icon: 'shield-alt' },
        { name: 'expiry_medical_date', label: 'Expiry Medical Date', type: 'date', placeholder: 'Select date', icon: 'shield-alt' },
        { name: 'passport_deliver_date', label: 'Passport Deliver Date', type: 'date', placeholder: 'Select passport deliver date', icon: 'calendar-day' }
    ];

    const section4Fields = [
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd' },
        { name: 'additional_charges', label: 'Additional Charges', type: 'number', placeholder: 'Enter additional charges', icon: 'plus-circle' },
        { name: 'pay_for_protector', label: 'Pay For Protector', type: 'number', placeholder: 'Enter pay for protector', icon: 'shield-alt' },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'bank_title', label: 'Bank Title', type: 'select', options: BANK_OPTIONS.map(opt => opt.value), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment amount', icon: 'university' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: true },
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
    className="mt-1 text-sm text-red-500 flex items-center !text-red-500"
>
    {(msg) => (
        <span className="flex items-center text-red-500">
            <i className="fas fa-exclamation-circle mr-1 text-red-500"></i> {msg}
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
                    <i className="fas fa-passport mr-3"></i>
                    {editEntry ? 'Update Visa Processing' : 'New Visa Processing'}
                </motion.h2>
                <motion.p 
                    className="text-blue-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Please fill in the visa processing details
                </motion.p>
            </div>

            {/* Progress tabs */}
            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2, 3, 4].map((step) => (
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
                                    {step === 1 ? 'Basic Info' : 
                                     step === 2 ? 'Passport Details' : 
                                     step === 3 ? 'Dates' : 'Payment Details'}
                                </span>
                            </div>
                            {step < 4 && (
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
                                {activeSection === 4 && section4Fields.map(renderField)}
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
                                    
                                    {activeSection < 4 ? (
                                        <motion.button
                                           
                                        >
                                           
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            type="submit"
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md hover:shadow-lg transition-all"
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

export default VisaProcessing_Form;