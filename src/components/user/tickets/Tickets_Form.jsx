import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts, incrementFormEntry } from '../../ui/api';
import axios from 'axios';

// Auto-calculation component for ticket form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        const receivable = parseInt(values.receivable_amount) || 0;
        const cashPaid = parseInt(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const payableToVendor = parseInt(values.payable_to_vendor) || 0;
        
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);
        
        if (payableToVendor > 0) {
            const profit = receivable - payableToVendor;
            setFieldValue('profit', profit);
        } else {
            setFieldValue('profit', '');
        }
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.payable_to_vendor,
        setFieldValue
    ]);
    
    return null;
};

const FormikConsumer = ({ children }) => {
    const formik = useFormikContext();
    return children(formik);
};

const Tickets_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [showPassengerSlider, setShowPassengerSlider] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);

    // Static bank titles from OfficeAccounts.jsx
    const bankOptions = [
        { value: "UNITED BANK (ubl1)", label: "UNITED BANK (M ALI RAZA)" },
        { value: "UNITED BANK (ubl2)", label: "UNITED BANK (FAIZAN E RAZA TRAVEL)" },
        { value: "HABIB BANK (HBL1)", label: "HABIB BANK (M ALI RAZA)" },
        { value: "HABIB BANK (HBL2)", label: "HABIB BANK (FAIZAN E RAZA TRAVEL)" },
        { value: "JAZZCASH", label: "JAZZCASH (M ALI RAZA)" },
        { value: "MCB", label: "MCB (FIT MANPOWER)" }
    ];

    const [formInitialValues, setFormInitialValues] = useState({
        employee_name: user?.username || '',
        agent_name: '',
        customer_add: '',
        reference: '',
        entry: '0/0',
        depart_date: '',
        return_date: '',
        sector: '',
        airline: '',
        adults: 0,
        children: 0,
        infants: 0,
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
        bank_title: '',
        paid_in_bank: '',
        payable_to_vendor: '',
        vendor_name: '',
        profit: '',
        remaining_amount: '0'
    });

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        reference: Yup.string().required('Reference is required'),
        depart_date: Yup.date().required('Travel Date is required').typeError('Invalid date'),
        return_date: Yup.date().required('Return Date is required').typeError('Invalid date'),
        sector: Yup.string().required('Sector is required'),
        airline: Yup.string().required('Airline is required'),
        adults: Yup.number().required('Adults is required').min(0, 'Adults cannot be negative'),
        children: Yup.number().required('Children is required').min(0, 'Children cannot be negative'),
        infants: Yup.number().required('Infants is required').min(0, 'Infants cannot be negative'),
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
        bank_title: Yup.string().required('Bank Title is required'),
        paid_in_bank: Yup.string().required('Paid In Bank is required'),
        payable_to_vendor: Yup.number().required('Payable To Vendor is required').typeError('Payable To Vendor must be a number'),
        
        profit: Yup.number(),
        remaining_amount: Yup.number()
    });

    // Fetch agent names
    useEffect(() => {
        const fetchAgentNames = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/agent-names/existing`);
                if (response.data.status === 'success') {
                    setAgentNames(response.data.agentNames || []);
                }
            } catch (error) {
                console.error('Error fetching agent names:', error);
            }
        };
        fetchAgentNames();
    }, [BASE_URL]);

    // Fetch vendor names
    useEffect(() => {
        const fetchVendorNames = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/vender-names/existing`);
                if (response.data.status === 'success') {
                    setVendorNames(response.data.vendorNames || []);
                }
            } catch (error) {
                console.error('Error fetching vendor names:', error);
            }
        };
        fetchVendorNames();
    }, [BASE_URL]);

    useEffect(() => {
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
        };

        if (editEntry) {
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passport_detail === 'string') {
                    try {
                        parsedPassportDetails = JSON.parse(editEntry.passport_detail);
                    } catch {
                        parsedPassportDetails = {};
                    }
                } else if (typeof editEntry.passport_detail === 'object' && editEntry.passport_detail !== null) {
                    parsedPassportDetails = editEntry.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            const [current, total] = editEntry.entry ? editEntry.entry.split('/').map(Number) : [0, 0];
            setEntryNumber(current);
            setTotalEntries(total);

            setFormInitialValues({
                employee_name: editEntry.employee_name || user?.username || '',
                agent_name: editEntry.agent_name || '',
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                entry: editEntry.entry || '0/0',
                depart_date: formatDate(editEntry.depart_date),
                return_date: formatDate(editEntry.return_date),
                sector: editEntry.sector || '',
                airline: editEntry.airline || '',
                adults: editEntry.adults || 0,
                children: editEntry.children || 0,
                infants: editEntry.infants || 0,
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
                bank_title: editEntry.bank_title || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                payable_to_vendor: editEntry.payable_to_vendor || '',
                vendor_name: editEntry.vendor_name || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || ''
            });
        } else {
            const getCounts = async () => {
                const counts = await fetchEntryCounts();
                if (counts) {
                    const ticketCounts = counts.find(c => c.form_type === 'ticket');
                    if (ticketCounts) {
                        setEntryNumber(ticketCounts.current_count + 1);
                        setTotalEntries(ticketCounts.global_count + 1);
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
                employee_name: user?.username || ''
            }));
        }
    }, [editEntry, user]);

    useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            entry: `${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries]);

    const handlePassengerChange = (type, delta, currentValues, setFieldValue) => {
        setFieldValue(type, Math.max(0, (currentValues[type] || 0) + delta));
    };

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

    try {
        const entryValueToSubmit = editEntry ? editEntry.entry : `${entryNumber}/${totalEntries}`;
        const parsedEntryNumber = parseInt(entryValueToSubmit.split('/')[0]);
        
        const requestData = {
            employee_name: values.employee_name,
            agent_name: values.agent_name,
            customer_add: values.customer_add,
            reference: values.reference,
            entry: entryValueToSubmit,
            depart_date: values.depart_date,
            return_date: values.return_date,
            sector: values.sector,
            airline: values.airline,
            adults: values.adults,
            children: values.children,
            infants: values.infants,
            passport_detail: passportDetail,
            receivable_amount: parseInt(values.receivable_amount),
            paid_cash: parseInt(values.paid_cash),
            bank_title: values.bank_title,
            paid_in_bank: values.paid_in_bank,
            payable_to_vendor: parseInt(values.payable_to_vendor),
            vendor_name: values.vendor_name,
            profit: parseInt(values.profit),
            remaining_amount: parseInt(values.remaining_amount)
        };

        console.log('Submitting ticket data:', requestData);

        const url = editEntry ? `${BASE_URL}/ticket/${editEntry.id}` : `${BASE_URL}/ticket`;
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

        if (!editEntry) {
            const updatedCounts = await incrementFormEntry('ticket', parsedEntryNumber);
            if (updatedCounts) {
                setEntryNumber(updatedCounts.currentCount);
                setTotalEntries(updatedCounts.globalCount);
            }
        }

        if (!editEntry) {
            const vendorDetail = JSON.stringify({
                sector: values.sector,
                depart_date: values.depart_date,
                return_date: values.return_date,
                airline: values.airline,
                passengerFirstName: values.passengerFirstName,
                passengerLastName: values.passengerLastName
            });

            const vendorData = {
                vender_name: values.vendor_name,
                detail: vendorDetail,
                debit: parseInt(values.payable_to_vendor),
                date: new Date().toISOString().split('T')[0],
                entry: '',
                bank_title: values.bank_title,
                credit: null
            };

            console.log('Submitting vendor data:', vendorData);

            const vendorResponse = await fetch(`${BASE_URL}/vender`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vendorData),
            });

            if (!vendorResponse.ok) {
                console.error('Vendor submission failed:', vendorResponse.status);
                setErrors({ general: 'Ticket saved, but failed to save vendor details. Please try again later.' });
            }

             // Add agent data submission
            const agentDetail = JSON.stringify({
                sector: values.sector,
                depart_date: values.depart_date,
                return_date: values.return_date,
                airline: values.airline,
                passengerFirstName: values.passengerFirstName,
                passengerLastName: values.passengerLastName
            });

            const agentData = {
                agent_name: values.agent_name,
                employee:values.employee,
                detail: agentDetail,
                credit: parseInt(values.receivable_amount),
                date: new Date().toISOString().split('T')[0],
                entry: '',
                bank_title: values.bank_title,
                debit: null
            };

            console.log('Submitting agent data:', agentData);

            const agentResponse = await fetch(`${BASE_URL}/agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(agentData),
            });

            if (!agentResponse.ok) {
                console.error('Agent submission failed:', agentResponse.status);
                setErrors({ general: 'Ticket saved, but failed to save agent details. Please try again later.' });
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
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'depart_date', label: 'Depart Date', type: 'date', placeholder: 'Enter Depart date', icon: 'calendar-alt' },
        { name: 'return_date', label: 'Return Date', type: 'date', placeholder: 'Enter return date', icon: 'calendar-alt' },
        { name: 'sector', label: 'Sector', type: 'text', placeholder: 'Enter sector', icon: 'map-marker-alt' },
        { name: 'airline', label: 'Airline', type: 'text', placeholder: 'Enter airline', icon: 'plane' },
    ];

    const section2Fields = [
        {
            name: 'passengerCount',
            label: 'Passenger',
            type: 'custom_passenger',
            icon: 'users'
        },
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
        { name: 'receivable_amount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd' },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },       
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'bank_title', label: 'Bank Title', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'text', placeholder: 'Enter bank payment details', icon: 'university' },
        { name: 'payable_to_vendor', label: 'Payable To Vendor', type: 'number', placeholder: 'Enter payable to vendor', icon: 'user-tie' },
        { name: 'vendor_name', label: 'Vendor Name', type: 'select', options: vendorNames, placeholder: 'Select vendor name', icon: 'store' },
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
                        <option value="">{field.placeholder}</option>
                        {field.options && field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Field>
                ) : field.type === 'custom_passenger' ? (
                    <Field name={field.name}>
                        {({ field: formikField, form: { values, setFieldValue } }) => (
                            <div
                                className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer bg-white flex justify-between items-center"
                                onClick={() => setShowPassengerSlider(!showPassengerSlider)}
                            >
                                <span>{`${values.adults} Adults, ${values.children} Children, ${values.infants} Infants`}</span>
                                <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
                            </div>
                        )}
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

                {field.name === 'passengerCount' && showPassengerSlider && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg p-4 mt-1 w-64 right-0"
                    >
                        <FormikConsumer>
                            {({ values, setFieldValue }) => (
                                <>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-700">Adults (12+ yrs)</span>
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('adults', -1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <span className="mx-3 font-semibold">{values.adults}</span>
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('adults', 1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-700">Children (2-12 yrs)</span>
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('children', -1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <span className="mx-3 font-semibold">{values.children}</span>
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('children', 1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-700">Infant (Under 2 yrs)</span>
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('infants', -1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <span className="mx-3 font-semibold">{values.infants}</span>
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                                                onClick={() => handlePassengerChange('infants', 1, values, setFieldValue)}
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right mt-4">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            onClick={() => setShowPassengerSlider(false)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </>
                            )}
                        </FormikConsumer>
                    </motion.div>
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-8 rounded-t-xl">
                <motion.h2 
                    className="text-2xl font-bold text-black flex items-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <i className="fas fa-ticket-alt mr-3"></i>
                    {editEntry ? 'Update Ticket' : 'New Ticket Booking'}
                </motion.h2>
                <motion.p 
                    className="text-blue-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    Please fill in the ticket details
                </motion.p>
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
                                    {step === 1 ? 'Ticket Info' : step === 2 ? 'Passport Details' : 'Payment Details'}
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

                            <motion.div 
                                className="flex justify-between mt-8 pt-4 border-t border-gray-200"
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
                                        className="px-5 py-2 border bg-gray-400 border-gray-300 rounded-lg text-black hover:bg-blue-600 transition-colors"
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

export default Tickets_Form;