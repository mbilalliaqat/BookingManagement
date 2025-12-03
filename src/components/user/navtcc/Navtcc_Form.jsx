import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import VenderNameModal from '../../ui/VenderNameModal';
import axios from 'axios';

// Auto-calculation component for navtcc form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        const receivable = parseInt(values.receivable_amount) || 0;
        const cashPaid = parseInt(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const payedToBank = parseFloat(values.payed_to_bank) || 0;
        
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);

        // Calculate total payable to vendors
        const totalVendorPayable = values.vendors.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
        
        // Calculate profit considering vendor payments
        const profit = payedToBank > 0 ? receivable - payedToBank : receivable - totalVendorPayable;
        setFieldValue('profit', profit);
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.payed_to_bank,
        values.vendors,
        setFieldValue
    ]);
    
    return null;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
};


const Navtcc_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [countsLoaded, setCountsLoaded] = useState(false); // NEW: Track if counts are loaded

    const [formInitialValues, setFormInitialValues] = useState({
        employee_name: user?.username || '',
        customer_add: '',
        entry: '0/0',
        reference: '',
        profession_key: '',
        passengerTitle: 'Mr',
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
        payed_to_bank: '',
        agent_name: '',
        vendors: [{ vendor_name: '', amount: '' }],
        profit: '',
        booking_date: new Date().toISOString().split('T')[0],  // Default today
remaining_date: '',
        remaining_amount: '0'
    });

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        reference: Yup.string().required('Reference is required'),
        profession_key: Yup.string().required('Profession key is required'),
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
        paid_in_bank: Yup.number().required('Paid In Bank is required').typeError('Paid In Bank must be a number'),
        paid_from_bank: Yup.string().required('Paid From Bank is required'),
        payed_to_bank: Yup.number().required('Payed To Bank is required').typeError('Payed To Bank must be a number'),
        agent_name: Yup.string().notRequired(),
        vendors: Yup.array().of(
            Yup.object().shape({
                vendor_name: Yup.string().when('amount', {
                    is: (val) => val && val !== '',
                    then: (schema) => schema.required('Vendor name is required when amount is provided'),
                    otherwise: (schema) => schema.notRequired()
                }),
                amount: Yup.number().typeError('Amount must be a number').notRequired().min(0, 'Amount cannot be negative')
            })
        ),
        profit: Yup.number(),
        remaining_amount: Yup.number()
    });

    // Fetch agent and vendor names
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [agentRes, vendorRes] = await Promise.all([
                    axios.get(`${BASE_URL}/agent-names/existing`),
                    axios.get(`${BASE_URL}/vender-names/existing`)
                ]);
                
                if (agentRes.data.status === 'success') {
                    setAgentNames(agentRes.data.agentNames || []);
                }
                if (vendorRes.data.status === 'success') {
                    setVendorNames(vendorRes.data.vendorNames || []);
                }
            } catch (error) {
                console.error('Error fetching names:', error);
            }
        };
        fetchData();
    }, [BASE_URL]);

    const handleVendorAdded = async (newVendorName) => {
        if (newVendorName && !vendorNames.includes(newVendorName)) {
            setVendorNames(prev => [...prev, newVendorName].sort());
        }
    };

    // FIXED: Fetch counts only once on component mount
    useEffect(() => {
        const getCounts = async () => {
            try {
                const counts = await fetchEntryCounts();
                if (counts) {
                    const navtccCounts = counts.find(c => c.form_type === 'navtcc');
                    if (navtccCounts) {
                        // For new entries, use current_count + 1
                        // The backend increments after successful submission
                        setEntryNumber(navtccCounts.current_count + 1);
                        setTotalEntries(navtccCounts.global_count + 1);
                    } else {
                        setEntryNumber(1);
                        setTotalEntries(1);
                    }
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
                setCountsLoaded(true);
            } catch (error) {
                console.error('Error fetching counts:', error);
                setEntryNumber(1);
                setTotalEntries(1);
                setCountsLoaded(true);
            }
        };
        
        // Only fetch if not editing and counts not loaded
        if (!editEntry && !countsLoaded) {
            getCounts();
        }
    }, []); // Empty dependency array - run only once

    // Update form values when entry numbers or user changes
    useEffect(() => {
        if (countsLoaded || editEntry) {
            setFormInitialValues(prev => ({
                ...prev,
                employee_name: user?.username || '',
                entry: editEntry ? editEntry.entry : `${entryNumber}/${totalEntries}`
            }));
        }
    }, [entryNumber, totalEntries, user, countsLoaded, editEntry]);

    useEffect(() => {
        if (editEntry) {
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passport_detail === 'string') {
                    try {
                        parsedPassportDetails = JSON.parse(editEntry.passport_detail);
                    } catch {
                        // Leave empty if not valid JSON
                    }
                } else if (typeof editEntry.passport_detail === 'object' && editEntry.passport_detail !== null) {
                    parsedPassportDetails = editEntry.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
            };

            // Parse vendors if stored as JSON
            let vendorsArray = [{ vendor_name: '', amount: '' }];
            if (editEntry.vendors) {
                try {
                    vendorsArray = typeof editEntry.vendors === 'string' 
                        ? JSON.parse(editEntry.vendors) 
                        : editEntry.vendors;
                } catch (e) {
                    console.error("Error parsing vendors:", e);
                }
            }

            const newValues = {
                employee_name: editEntry.employee_name || user?.username || '',
                entry: editEntry.entry || `${entryNumber}/${totalEntries}`,
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                profession_key: editEntry.profession_key || '',
                passengerTitle: parsedPassportDetails.title || 'Mr',
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
                paid_from_bank: editEntry.paid_from_bank || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                payed_to_bank: editEntry.payed_to_bank || '',
                agent_name: editEntry.agent_name || '',
                vendors: vendorsArray,
                profit: editEntry.profit || '',
                booking_date: formatDate(editEntry.booking_date) || new Date().toISOString().split('T')[0],
remaining_date: formatDate(editEntry.remaining_date) || '',
                remaining_amount: editEntry.remaining_amount || ''
            };
            
            setFormInitialValues(newValues);
        }
    }, [editEntry, user, entryNumber, totalEntries]);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
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

        // Filter out empty vendors
        const validVendors = values.vendors.filter(v => v.vendor_name && v.amount);

        const requestData = {
            employee_name: values.employee_name,
            customer_add: values.customer_add,
            entry: values.entry,
            reference: values.reference,
            profession_key: values.profession_key,
            passport_detail: passportDetail,
            receivable_amount: parseInt(values.receivable_amount),
            paid_cash: parseInt(values.paid_cash),
            paid_from_bank: values.paid_from_bank,
            paid_in_bank: values.paid_in_bank,
            payed_to_bank: values.payed_to_bank,
            agent_name: values.agent_name || null,
            vendors: JSON.stringify(validVendors),
            profit: parseInt(values.profit),
            booking_date: values.booking_date,
remaining_date: values.remaining_date || null,
            remaining_amount: parseInt(values.remaining_amount)
        };

        try {
            const url = editEntry ? `${BASE_URL}/navtcc/${editEntry.id}` : `${BASE_URL}/navtcc`;
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

            await response.json();

            // Submit to accounts if bank payment exists
            if (parseFloat(values.paid_in_bank) > 0 && values.paid_from_bank) {
                const bankData = {
                    bank_name: values.paid_from_bank,
                    employee_name: values.employee_name,
                    detail: `Navtcc Sale - ${values.customer_add} - ${values.reference}`,
                    credit: parseFloat(values.paid_in_bank),
                    debit: 0,
                    date: new Date().toISOString().split('T')[0],
                    entry: values.entry,
                };

                try {
                    await axios.post(`${BASE_URL}/accounts`, bankData);
                } catch (error) {
                    console.error('Error storing bank transaction:', error);
                }
            }

            // Submit to vendors (multiple vendors)
            for (const vendor of validVendors) {
                if (vendor.vendor_name && parseFloat(vendor.amount) > 0) {
                    const vendorData = {
                        vender_name: vendor.vendor_name,
                        detail: `NAVTCC - ${values.reference} - ${values.customer_add}`,
                        credit: parseFloat(vendor.amount),
                        date: new Date().toISOString().split('T')[0],
                        entry: values.entry,
                        bank_title: values.paid_from_bank || null,
                        debit: null
                    };

                    try {
                        await axios.post(`${BASE_URL}/vender`, vendorData);
                    } catch (error) {
                        console.error('Error storing vendor transaction:', error);
                    }
                }
            }

            // Submit to agent if agent details exist
            if (values.agent_name) {
                const agentData = {
                    agent_name: values.agent_name,
                    employee: values.employee_name,
                    detail: `NAVTCC - ${values.reference} - ${values.customer_add}`,
                    receivable_amount: parseFloat(values.receivable_amount) || 0,
                    paid_cash: parseFloat(values.paid_cash) || 0,
                    paid_bank: parseFloat(values.paid_in_bank) || 0,
                    credit: parseFloat(values.remaining_amount) || 0,
                    date: new Date().toISOString().split('T')[0],
                    entry: values.entry,
                    bank_title: values.paid_from_bank || null,
                    debit: null
                };

                try {
                    await axios.post(`${BASE_URL}/agent`, agentData);
                } catch (error) {
                    console.error('Error storing agent transaction:', error);
                }
            }

            resetForm();
            onSubmitSuccess();
        } catch (error) {
            console.error('Error:', error);
            setErrors({ general: error.message || 'Failed to submit form. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

    const bankOptions = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

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

    const section1Fields = [
        { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
       { name: 'booking_date', label: 'Booking Date', type: 'date' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true }, 
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'profession_key', label: 'Profession Key', type: 'text', placeholder: 'Enter Profession key', icon: 'plane' },
    ];

    const section2Fields = [
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Dr'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        // { name: 'passengerNationality', label: 'Nationality', type: 'text', placeholder: 'Enter nationality', icon: 'flag' },
        { name: 'documentType', label: 'Document Type', type: 'select', options: ['Passport'], placeholder: 'Select document type', icon: 'id-card' },
        { name: 'documentNo', label: 'Passport No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
        // { name: 'documentIssueCountry', label: 'Issue Country', type: 'text', placeholder: 'Enter issue country', icon: 'globe' },
    ];

    const section3Fields = [
        { name: 'receivable_amount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd' },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'paid_from_bank', label: 'Bank Title', type: 'select', options: bankOptions.map(option => option.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment details', icon: 'university' },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'payed_to_bank', label: 'Payed To Bank', type: 'number', placeholder: 'Enter amount paid to bank', icon: 'university' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: true},
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date' },
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
                            {editEntry ? 'Update Navtcc' : 'New Navtcc'}
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
                                    {step === 1 ? 'Navtcc Info' : step === 2 ? 'Passport Details' : 'Payment Details'}
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

            <div className="px-8 pb-8">
                <Formik
                    initialValues={formInitialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                >
                    {({ isSubmitting, errors, values, setFieldValue }) => (
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
                                {activeSection === 3 && (
                                    <>
                                        {section3Fields.map(renderField)}
                                        
                                        {/* Multiple Vendors Section */}
                                        <motion.div className="col-span-1 md:col-span-2 mt-4" variants={itemVariants}>
                                            <div className="border-t pt-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Vendor Details (Multiple)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsVendorModalOpen(true)}
                                                        className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-sm"
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> New Vendor
                                                    </button>
                                                </div>
                                                
                                                {values.vendors.map((vendor, index) => (
                                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-md">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Vendor Name
                                                            </label>
                                                            <Field
                                                                as="select"
                                                                name={`vendors.${index}.vendor_name`}
                                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                            >
                                                                <option value="">Select vendor</option>
                                                                {vendorNames.map((name) => (
                                                                    <option key={name} value={name}>
                                                                        {name}
                                                                    </option>
                                                                ))}
                                                            </Field>
                                                            <ErrorMessage 
                                                                name={`vendors.${index}.vendor_name`}
                                                                component="p"
                                                                className="mt-1 text-xs text-red-500"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                    Amount
                                                                </label>
                                                                <Field
                                                                    type="number"
                                                                    name={`vendors.${index}.amount`}
                                                                    placeholder="Enter amount"
                                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                                />
                                                                <ErrorMessage 
                                                                    name={`vendors.${index}.amount`}
                                                                    component="p"
                                                                    className="mt-1 text-xs text-red-500"
                                                                />
                                                            </div>
                                                            
                                                            {values.vendors.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newVendors = values.vendors.filter((_, i) => i !== index);
                                                                        setFieldValue('vendors', newVendors);
                                                                    }}
                                                                    className="self-end bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFieldValue('vendors', [...values.vendors, { vendor_name: '', amount: '' }]);
                                                    }}
                                                    className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                                                >
                                                    <i className="fas fa-plus mr-1"></i> Add Another Vendor
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
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

            <VenderNameModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onVenderAdded={handleVendorAdded}
            />
        </div>
    );
};

export default Navtcc_Form;