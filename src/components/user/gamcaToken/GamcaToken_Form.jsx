import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import VenderNameModal from '../../ui/VenderNameModal';
import axios from 'axios';

// --- Auto-calculation component ---
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        
        const totalPayableToVendors = values.vendors?.reduce((sum, vendor) => {
            return sum + (parseFloat(vendor.payable_amount) || 0);
        }, 0) || 0;
        
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining.toFixed(2));

        const profit = totalPayableToVendors > 0 ? receivable - totalPayableToVendors : '';
        setFieldValue('profit', profit ? profit.toFixed(2) : '');
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.vendors,
        setFieldValue
    ]);
    
    return null;
};

// --- Vendor Selection Component ---
const VendorSelectionFields = ({ values, setFieldValue, vendorNames, setIsVendorModalOpen, editEntry }) => {
    const addVendor = () => {
        const newVendors = [...(values.vendors || []), { vendor_name: '', payable_amount: '' }];
        setFieldValue('vendors', newVendors);
    };

    const removeVendor = (index) => {
        const newVendors = values.vendors.filter((_, i) => i !== index);
        setFieldValue('vendors', newVendors);
    };

    return (
        <div className="col-span-2 border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                    Vendor Details
                </h4>
                <button
                    type="button"
                    onClick={addVendor}
                    className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 flex items-center text-sm"
                >
                    Add Vendor
                </button>
            </div>

            {values.vendors && values.vendors.length > 0 ? (
                <div className="space-y-4">
                    {values.vendors.map((vendor, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-md border border-gray-200"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor Name
                                </label>
                                <div className="flex items-center gap-2">
                                    <Field
                                        as="select"
                                        name={`vendors[${index}].vendor_name`}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={editEntry}
                                    >
                                        <option value="">Select vendor name</option>
                                        {vendorNames.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </Field>
                                    <button
                                        type="button"
                                        onClick={() => setIsVendorModalOpen(true)}
                                        className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700"
                                    >
                                    </button>
                                </div>
                                <ErrorMessage 
                                    name={`vendors[${index}].vendor_name`} 
                                    component="p" 
                                    className="mt-1 text-sm text-red-500 flex items-center"
                                >
                                    {(msg) => (
                                        <span className="flex items-center text-red-500">
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payable Amount
                                </label>
                                <div className="flex items-center gap-2">
                                    <Field
                                        type="number"
                                        name={`vendors[${index}].payable_amount`}
                                        placeholder="Enter payable amount"
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={editEntry}
                                    />
                                    {values.vendors.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVendor(index)}
                                            className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                                        >
                                        </button>
                                    )}
                                </div>
                                <ErrorMessage 
                                    name={`vendors[${index}].payable_amount`} 
                                    component="p" 
                                    className="mt-1 text-sm text-red-500 flex items-center"
                                >
                                    {(msg) => (
                                        <span className="flex items-center text-red-500">
                                            {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    Click "Add Vendor" to add vendor details
                </div>
            )}
        </div>
    );
};

const GamcaToken_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

    // Helper: format date string to YYYY-MM-DD
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    };

    // Memoized initial values
    const initialValues = useMemo(() => {
        const base = {
            employee_name: user?.username || '',
            customer_add: '',
            entry: `GM ${entryNumber}/${totalEntries}`,
            reference: '',
            country: '',
            booking_date: new Date().toISOString().split('T')[0], // Today by default
            remaining_date: '',
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
            paid_from_bank: '',
            paid_in_bank: '',
            vendors: [{ vendor_name: '', payable_amount: '' }],
            agent_name: '',
            profit: '',
            remaining_amount: '0'
        };

        if (editEntry) {
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passport_detail === 'string') {
                    parsedPassportDetails = JSON.parse(editEntry.passport_detail);
                } else if (typeof editEntry.passport_detail === 'object' && editEntry.passport_detail !== null) {
                    parsedPassportDetails = editEntry.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            return {
                ...base,
                employee_name: editEntry.employee_name || user?.username || '',
                entry: editEntry.entry || `GM ${entryNumber}/${totalEntries}`,
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                country: editEntry.country || '',
                booking_date: formatDate(editEntry.booking_date) || new Date().toISOString().split('T')[0],
                remaining_date: formatDate(editEntry.remaining_date) || '',
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
                vendors: editEntry.vendors_detail 
                    ? JSON.parse(editEntry.vendors_detail)
                    : [{ vendor_name: '', payable_amount: '' }],
                agent_name: editEntry.agent_name || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '0'
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        reference: Yup.string().notRequired(),
        country: Yup.string().required('Country is required'),
        booking_date: Yup.date().required('Booking Date is required').typeError('Invalid booking date'),
        remaining_date: Yup.date().nullable().typeError('Invalid remaining date'),
        passengerTitle: Yup.string().required('Title is required'),
        passengerFirstName: Yup.string().required('First Name is required'),
        passengerLastName: Yup.string().required('Last Name is required'),
        passengerDob: Yup.date().notRequired().typeError('Invalid date'),
        passengerNationality: Yup.string().notRequired(),
        documentType: Yup.string().notRequired(),
        documentNo: Yup.string().notRequired(),
        documentExpiry: Yup.date().notRequired().typeError('Invalid date'),
        documentIssueCountry: Yup.string().notRequired(),
        receivable_amount: Yup.number().required('Receivable Amount is required').typeError('Must be a number'),
        paid_cash: Yup.number().notRequired().typeError('Must be a number'),
        paid_from_bank: Yup.string().notRequired(),
        paid_in_bank: Yup.number().notRequired().typeError('Must be a number'),
        vendors: Yup.array().of(
            Yup.object().shape({
                vendor_name: Yup.string().notRequired('Vendor name is required'),
                payable_amount: Yup.number().notRequired('Payable amount is required').min(0, 'Amount must be positive'),
            })
        ).min(1, 'At least one vendor is required'),
        agent_name: Yup.string().notRequired(),
        profit: Yup.number().typeError('Profit must be a number').notRequired(),
        remaining_amount: Yup.number().typeError('Remaining Amount must be a number').notRequired()
    });

    const bankOptions = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

    // Fetch agent & vendor names
   useEffect(() => {
    const loadInitialData = async () => {
        try {
            const [countsRes, agentRes, vendorRes] = await Promise.all([
                fetchEntryCounts(),
                axios.get(`${BASE_URL}/agent-names/existing`),
                axios.get(`${BASE_URL}/vender-names/existing`)
            ]);

            const gamcaCounts = countsRes.find(c => c.form_type === 'gamca');
            if (gamcaCounts) {
                setEntryNumber(gamcaCounts.current_count + 1);
                setTotalEntries(gamcaCounts.global_count + 1);  // +1 for the next entry
            }

            if (agentRes.data.status === 'success') setAgentNames(agentRes.data.agentNames || []);
            if (vendorRes.data.status === 'success') setVendorNames(vendorRes.data.vendorNames || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    loadInitialData();
}, [BASE_URL]);

    const handleVendorAdded = (newVendorName) => {
        if (newVendorName && !vendorNames.includes(newVendorName)) {
            setVendorNames(prev => [...prev, newVendorName].sort());
        }
    };

    // Fetch entry counts
    useEffect(() => {
        let isMounted = true;
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (isMounted && counts) {
                const gamcaCounts = counts.find(c => c.form_type === 'gamca');
                if (gamcaCounts) {
                    setEntryNumber(gamcaCounts.current_count + 1);
                    setTotalEntries(gamcaCounts.global_count);
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

    const totalPayableToVendor = values.vendors.reduce((sum, v) => sum + (parseFloat(v.payable_amount) || 0), 0);

    const requestData = {
        employee_name: values.employee_name,
        customer_add: values.customer_add,
        entry: values.entry,
        reference: values.reference,
        country: values.country,
        booking_date: values.booking_date,
        remaining_date: values.remaining_date || null,
        passport_detail: passportDetail,
        receivable_amount: parseFloat(values.receivable_amount) || 0,
        paid_cash: parseFloat(values.paid_cash) || 0,
        paid_from_bank: values.paid_from_bank || null,
        paid_in_bank: parseFloat(values.paid_in_bank) || 0,
        payable_to_vendor: totalPayableToVendor,
        vendor_name: values.vendors.map(v => v.vendor_name).join(', '),
        vendors_detail: JSON.stringify(values.vendors),
        agent_name: values.agent_name || null,
        profit: parseFloat(values.profit) || 0,
        remaining_amount: parseFloat(values.remaining_amount) || 0
    };

    try {
        const url = editEntry ? `${BASE_URL}/gamca-token/${editEntry.id}` : `${BASE_URL}/gamca-token`;
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

        // ✅ UPDATED: Removed manual increment call - backend handles it automatically
        if (!editEntry) {
            // Just refresh the entry counts to get the updated numbers
            const counts = await fetchEntryCounts();
            const gamcaCounts = counts.find(c => c.form_type === 'gamca');
            if (gamcaCounts) {
                setEntryNumber(gamcaCounts.current_count + 1);
                setTotalEntries(gamcaCounts.global_count);
            }
        }

        // Bank transaction
        if (parseFloat(values.paid_in_bank) > 0 && values.paid_from_bank) {
            await axios.post(`${BASE_URL}/accounts`, {
                bank_name: values.paid_from_bank,
                employee_name: values.employee_name,
                detail: `Gamca Sale - ${values.customer_add} - ${values.reference}`,
                credit: parseFloat(values.paid_in_bank),
                debit: 0,
                date: new Date().toISOString().split('T')[0],
                entry: values.entry,
            });
        }

        // Vendor transactions
        for (const vendor of values.vendors) {
            if (vendor.vendor_name && parseFloat(vendor.payable_amount) > 0) {
                await axios.post(`${BASE_URL}/vender`, {
                    vender_name: vendor.vendor_name,
                    detail: `GAMCA - ${values.reference} - ${values.customer_add}`,
                    credit: parseFloat(vendor.payable_amount),
                    date: new Date().toISOString().split('T')[0],
                    entry: values.entry,
                    bank_title: values.paid_from_bank || null,
                    debit: null
                });
            }
        }

        // Agent transaction
        if (values.agent_name) {
            await axios.post(`${BASE_URL}/agent`, {
                agent_name: values.agent_name,
                employee: values.employee_name,
                detail: `GAMCA - ${values.reference} - ${values.customer_add}`,
                receivable_amount: parseFloat(values.receivable_amount),
                paid_cash: parseFloat(values.paid_cash),
                paid_bank: parseFloat(values.paid_in_bank),
                credit: parseFloat(values.remaining_amount),
                date: new Date().toISOString().split('T')[0],
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

    // Updated Section 1 with new date fields
    const section1Fields = [
        { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country', icon: 'globe' },
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: '', icon: 'calendar-check' },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date', placeholder: '', icon: 'calendar-times' },
    ];

    const section2Fields = [
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Dr'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        { name: 'documentNo', label: 'Passport No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
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
                {field.label} {field.name === 'booking_date' && <span className="text-red-500">*</span>}
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
                        <motion.h2 className="text-2xl font-bold text-black flex items-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                            {editEntry ? 'Update GAMCA Token' : 'New GAMCA Token'}
                        </motion.h2>
                        <motion.p className="text-indigo-600 mt-1">Please fill in the details</motion.p>
                    </div>
                    <button type="button" onClick={onCancel} className="text-black hover:text-gray-600 ml-4">
                    </button>
                </div>
            </div>

            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((step) => (
                        <button key={step} onClick={() => setActiveSection(step)} className={`flex-1 ${step === activeSection ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full mb-2 ${step === activeSection ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {step < activeSection ? '' : <span className="font-medium">{step}</span>}
                                </div>
                                <span className="text-sm">{step === 1 ? 'Basic Info' : step === 2 ? 'Passport Details' : 'Payment Details'}</span>
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
                                        <VendorSelectionFields
                                            values={values}
                                            setFieldValue={setFieldValue}
                                            vendorNames={vendorNames}
                                            setIsVendorModalOpen={setIsVendorModalOpen}
                                            editEntry={editEntry}
                                        />
                                    </>
                                )}
                            </motion.div>

                            {errors.general && (
                                <div className="text-red-600 mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                                    {errors.general}
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-4 border-t">
                                <div>
                                    {activeSection > 1 && (
                                        <button type="button" onClick={() => setActiveSection(activeSection - 1)} className="px-4 py-2 text-indigo-600">
                                            Back
                                        </button>
                                    )}
                                </div>
                                <div className="flex space-x-3">
                                    <button type="button" onClick={onCancel} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                                        Cancel
                                    </button>
                                    {activeSection < 3 && (
                                        <button type="button" onClick={() => setActiveSection(activeSection + 1)} className="px-5 py-2 bg-indigo-600 text-white rounded-lg">
                                            Next
                                        </button>
                                    )}
                                    {activeSection === 3 && (
                                        <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg" disabled={isSubmitting}>
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

            <VenderNameModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onVenderAdded={handleVendorAdded}
            />
        </div>
    );
};

export default GamcaToken_Form;