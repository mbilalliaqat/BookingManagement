import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import VenderNameModal from '../../ui/VenderNameModal';
import axios from 'axios';

// --- Constants ---
const VISA_TYPES = ['NAVTTC', 'VISIT VISA', 'WORK VISA', 'E-PROTECTOR', 'Cash Paid','OTHERS'];

const BANK_OPTIONS = [
    { value: "UBL M.A.R", label: "UBL M.A.R" },
    { value: "UBL F.Z", label: "UBL F.Z" },
    { value: "HBL M.A.R", label: "HBL M.A.R" },
    { value: "HBL F.Z", label: "HBL F.Z" },
    { value: "JAZ C", label: "JAZ C" },
    { value: "MCB FIT", label: "MCB FIT" },
];

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
};

// --- Auto-calculation component ---
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        // Skip calculation if visa type is "Cash Paid"
        if (values.visa_type === 'Cash Paid') {
            setFieldValue('remaining_amount', '0');
            setFieldValue('profit', '');
            return;
        }

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
        values.visa_type,
        setFieldValue
    ]);
    
    return null;
};

// --- Vendor Selection Component ---
const VendorSelectionFields = ({ values, setFieldValue, vendorNames, setIsVendorModalOpen, editEntry,user }) => {
    const addVendor = () => {
        const newVendors = [...(values.vendors || []), { vendor_name: '', payable_amount: '' }];
        setFieldValue('vendors', newVendors);
    };

    const removeVendor = (index) => {
        const newVendors = values.vendors.filter((_, i) => i !== index);
        setFieldValue('vendors', newVendors);
    };

    if (user?.role !== 'admin') {   
    return null; // Don't render anything if user is not admin
    }

    return (
        <div className="col-span-2 border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                    <i className="fas fa-store mr-2"></i>
                    Vendor Details
                </h4>
                <button
                    type="button"
                    onClick={addVendor}
                    className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 flex items-center text-sm"
                >
                    <i className="fas fa-plus mr-2"></i> Add Vendor
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
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <ErrorMessage 
                                    name={`vendors[${index}].vendor_name`} 
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
                                            <i className="fas fa-trash"></i>
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
                                            <i className="fas fa-exclamation-circle mr-1"></i> {msg}
                                        </span>
                                    )}
                                </ErrorMessage>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    <i className="fas fa-info-circle mr-2"></i>
                    Click "Add Vendor" to add vendor details
                </div>
            )}
        </div>
    );
};

// --- Main Services_Form Component ---
const Services_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isOpeningBalance, setIsOpeningBalance] = useState(false);

    // Status options (same as other forms)
    const STATUS_OPTIONS = [
        { value: "Processing", label: "Processing" },
        { value: "Complete", label: "Complete" },
        { value: "Deliver", label: "Deliver" },
    ];

    // Memoize initial values
    const initialValues = useMemo(() => {
        const base = {
            user_name: user?.username || '',
            entry: `SE ${entryNumber}/${totalEntries}`,
            customer_add: '',
            booking_date: new Date().toISOString().split('T')[0],
            status: 'Processing',
            specific_detail: '',
            visa_type: '',
            receivable_amount: '',
            paid_cash: '',
            paid_from_bank: '',
            paid_in_bank: '',
            vendors: [{ vendor_name: '', payable_amount: '' }],
            agent_name: '',
            profit: '',
            remaining_date: '',
            remaining_amount: '0',
            opening_balance_amount: ''
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
                entry: editEntry.entry || `SE ${entryNumber}/${totalEntries}`,
                customer_add: editEntry.customer_add || '',
                booking_date: formatDate(editEntry.booking_date),
                status: editEntry.status || 'Processing',
                specific_detail: editEntry.specific_detail || '',
                visa_type: editEntry.visa_type || '',
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_from_bank: editEntry.paid_from_bank || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                vendors: editEntry.vendor_name && editEntry.payable_to_vendor ? 
                    [{ vendor_name: editEntry.vendor_name, payable_amount: editEntry.payable_to_vendor }] : 
                    [{ vendor_name: '', payable_amount: '' }],
                agent_name: editEntry.agent_name || '',
                profit: editEntry.profit || '',
                remaining_date: formatDate(editEntry.remaining_date) || '',
                remaining_amount: editEntry.remaining_amount || '0',
                opening_balance_amount: ''
            };
        }
        return base;
    }, [editEntry, user, entryNumber, totalEntries]);

    const validationSchema = Yup.object().shape({
        user_name: Yup.string().required('User Name is required'),
        customer_add: Yup.string().when(['$isOpeningBalance', 'visa_type'], {
            is: (isOpeningBalance, visa_type) => !isOpeningBalance && visa_type !== 'Cash Paid',
            then: (schema) => schema.notRequired('Customer Address is required'),
            otherwise: (schema) => schema.notRequired()
        }),
        booking_date: Yup.date().notRequired('Booking Date is required').typeError('Invalid date'),
        status: Yup.string().required('Status is required').oneOf(STATUS_OPTIONS.map(opt => opt.value), 'Invalid status'),
        specific_detail: Yup.string().required('Specific Detail is required'),
        visa_type: Yup.string().when('$isOpeningBalance', {
            is: false,
            then: (schema) => schema.required('Visa Type is required').oneOf(VISA_TYPES, 'Invalid Visa Type'),
            otherwise: (schema) => schema.notRequired()
        }),
        receivable_amount: Yup.number().when(['$isOpeningBalance', 'visa_type'], {
            is: (isOpeningBalance, visa_type) => !isOpeningBalance && visa_type !== 'Cash Paid',
            then: (schema) => schema.typeError('Receivable Amount must be a number').notRequired('Receivable Amount is required').min(0, 'Amount cannot be negative'),
            otherwise: (schema) => schema.notRequired()
        }),
        paid_cash: Yup.number().when('visa_type', {
            is: 'Cash Paid',
            then: (schema) => schema.typeError('Paid Cash must be a number').required('Paid Cash is required for Cash Paid visa type').min(0, 'Amount cannot be negative'),
            otherwise: (schema) => schema.typeError('Paid Cash must be a number').notRequired().min(0, 'Amount cannot be negative')
        }),
        paid_from_bank: Yup.string().notRequired(),
        paid_in_bank: Yup.number().typeError('Paid In Bank must be a number').notRequired().min(0, 'Amount cannot be negative'),
        vendors: Yup.array().when(['$isOpeningBalance', 'visa_type'], {
            is: (isOpeningBalance, visa_type) => !isOpeningBalance && visa_type !== 'Cash Paid',
            then: (schema) => schema.of(
                Yup.object().shape({
                    vendor_name: Yup.string().notRequired('Vendor name is required'),
                    payable_amount: Yup.number().notRequired('Payable amount is required').min(0, 'Amount must be positive'),
                })
            ).min(1, 'At least one vendor is required'),
            otherwise: (schema) => schema.notRequired()
        }),
        agent_name: Yup.string().notRequired(),
        profit: Yup.number().typeError('Profit must be a number').notRequired(),
        remaining_amount: Yup.number().typeError('Remaining Amount must be a number').min(0, 'Remaining amount cannot be negative'),
        opening_balance_amount: Yup.number().when('$isOpeningBalance', {
            is: true,
            then: (schema) => schema.typeError('Opening Balance must be a number').required('Opening Balance is required'),
            otherwise: (schema) => schema.notRequired()
        })
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

    const handleOpeningBalanceChange = (e, setFieldValue, values) => {
        const isChecked = e.target.checked;
        setIsOpeningBalance(isChecked);
        
        if (isChecked) {
            setFieldValue('customer_add', '');
            setFieldValue('visa_type', '');
            setFieldValue('receivable_amount', '');
            setFieldValue('paid_cash', '');
            setFieldValue('paid_from_bank', '');
            setFieldValue('paid_in_bank', '');
            setFieldValue('vendors', [{ vendor_name: '', payable_amount: '' }]);
            setFieldValue('agent_name', '');
            setFieldValue('profit', '');
            setFieldValue('remaining_date', '');
            setFieldValue('remaining_amount', '0');
            setFieldValue('specific_detail', 'OPENING BALANCE');
        } else {
            setFieldValue('opening_balance_amount', '');
            setFieldValue('specific_detail', '');
        }
    };

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        const isCashPaid = values.visa_type === 'Cash Paid';
        
        const totalPayableToVendor = isCashPaid ? 0 : values.vendors.reduce((sum, vendor) => {
            return sum + (parseFloat(vendor.payable_amount) || 0);
        }, 0);

        let requestData;

        if (isOpeningBalance) {
            const openingBalanceValue = parseFloat(values.opening_balance_amount) || 0;
            requestData = {
                user_name: values.user_name,
                entry: values.entry,
                status: values.status || null,
                customer_add: 'OPENING BALANCE',
                booking_date: values.booking_date,
                specific_detail: values.specific_detail || 'OPENING BALANCE',
                visa_type: 'OPENING BALANCE',
                receivable_amount: openingBalanceValue < 0 ? Math.abs(openingBalanceValue) : 0,
                paid_cash: 0,
                paid_from_bank: null,
                paid_in_bank: 0,
                payable_to_vendor: 0,
                vendor_name: null,
                vendors_detail: JSON.stringify([]),
                agent_name: null,
                profit: 0,
                remaining_date: null,
                remaining_amount: openingBalanceValue,
                opening_balance_amount: openingBalanceValue
            };
        } else if (isCashPaid) {
            requestData = {
                user_name: values.user_name,
                entry: values.entry,
                status: values.status || null,
                customer_add: values.customer_add || 'Cash Payment',
                booking_date: values.booking_date,
                specific_detail: values.specific_detail,
                visa_type: values.visa_type,
                receivable_amount: parseFloat(values.paid_cash) || 0,
                paid_cash: parseFloat(values.paid_cash) || 0,
                paid_from_bank: null,
                paid_in_bank: 0,
                payable_to_vendor: 0,
                vendor_name: null,
                vendors_detail: JSON.stringify([]),
                agent_name: null,
                profit: 0,
                remaining_date: null,
                remaining_amount: 0
            };
        } else {
            requestData = {
                user_name: values.user_name,
                entry: values.entry,
                status: values.status || null,
                customer_add: values.customer_add,
                booking_date: values.booking_date,
                specific_detail: values.specific_detail,
                visa_type: values.visa_type,
                receivable_amount: parseFloat(values.receivable_amount) || 0,
                paid_cash: parseFloat(values.paid_cash) || 0,
                paid_from_bank: values.paid_from_bank || null,
                paid_in_bank: parseFloat(values.paid_in_bank) || 0,
                payable_to_vendor: totalPayableToVendor,
                vendor_name: values.vendors.map(v => v.vendor_name).join(', '),
                vendors_detail: JSON.stringify(values.vendors),
                agent_name: values.agent_name || null,
                profit: parseFloat(values.profit) || 0,
                remaining_date: values.remaining_date || null,
                remaining_amount: parseFloat(values.remaining_amount) || 0
            };
        }

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

            const submittedEntry = await response.json();

            if (!isOpeningBalance && !isCashPaid) {
                if (parseFloat(values.paid_in_bank) > 0 && values.paid_from_bank) {
                    const bankData = {
                        bank_name: values.paid_from_bank,
                        employee_name: values.user_name,
                        detail: `Service Sale - ${values.customer_add} - ${values.specific_detail}`,
                        credit: parseFloat(values.paid_in_bank),
                        debit: 0,
                        date: values.booking_date,
                        entry: values.entry,
                    };

                    try {
                        await axios.post(`${BASE_URL}/accounts`, bankData);
                    } catch (error) {
                        console.error('Error storing bank transaction:', error);
                    }
                }

                for (const vendor of values.vendors) {
                    if (vendor.vendor_name && parseFloat(vendor.payable_amount) > 0) {
                        const vendorData = {
                            vender_name: vendor.vendor_name,
                            detail: `Service - ${values.specific_detail} - ${values.customer_add}`,
                            credit: parseFloat(vendor.payable_amount) || 0,
                            date: values.booking_date,
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

                if (values.agent_name) {
                    const agentData = {
                        agent_name: values.agent_name,
                        employee: values.user_name,
                        detail: `Service - ${values.specific_detail} - ${values.customer_add}`,
                        receivable_amount: parseFloat(values.receivable_amount) || 0,
                        paid_cash: parseFloat(values.paid_cash) || 0,
                        paid_bank: parseFloat(values.paid_in_bank) || 0,
                        credit: parseFloat(values.remaining_amount) || 0,
                        date: values.booking_date,
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
            }

            resetForm();
            setIsOpeningBalance(false);
            onSubmitSuccess(submittedEntry);
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
        { name: 'user_name', label: 'User Name', type: 'text', placeholder: 'Enter user name', icon: 'user', readOnly: true },
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: 'Select booking date', icon: 'calendar' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.map(opt => opt.value), placeholder: 'Select status', icon: 'tasks' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true }, 
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
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
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd' , readOnly: !!editEntry },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave', readOnly: !!editEntry },
        { name: 'paid_from_bank', label: 'Bank Title', type: 'select', options: BANK_OPTIONS.map(opt => opt.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment details', icon: 'university', readOnly: !!editEntry },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: !!editEntry },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: !!editEntry },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date', placeholder: '', icon: 'calendar-times' },
    ];  

    const renderField = (field, values, setFieldValue) => (
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
                        {editEntry ? 'Update Service' : 'New Service'}
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
                context={{ isOpeningBalance }}
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
                            {activeSection === 1 && section1Fields.map(field => renderField(field, values, setFieldValue))}
                            {activeSection === 2 && section2Fields.map(field => renderField(field, values, setFieldValue))}
                            {activeSection === 3 && (
                                <>
                                    {values.visa_type === 'Cash Paid' ? (
                                        <>
                                            {renderField(
                                                { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
                                                values, 
                                                setFieldValue
                                            )}
                                            <motion.div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg" variants={itemVariants}>
                                                <p className="text-sm text-blue-700 flex items-center">
                                                    <i className="fas fa-info-circle mr-2"></i>
                                                    Cash Paid mode: Only cash amount is required. Other fields are not needed.
                                                </p>
                                            </motion.div>
                                        </>
                                    ) : (
                                        <>
                                            {section3Fields.map(field => renderField(field, values, setFieldValue))}
                                            <VendorSelectionFields 
                                                values={values} 
                                                setFieldValue={setFieldValue} 
                                                vendorNames={vendorNames}
                                                setIsVendorModalOpen={setIsVendorModalOpen}
                                                editEntry={editEntry}
                                                user={user}
                                            />
                                        </>
                                    )}
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

        <VenderNameModal
            isOpen={isVendorModalOpen}
            onClose={() => setIsVendorModalOpen(false)}
            onVenderAdded={handleVendorAdded}
        />
    </div>
);
};

export default Services_Form;