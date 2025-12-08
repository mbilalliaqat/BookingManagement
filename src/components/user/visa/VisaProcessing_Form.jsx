// Modified VisaProcessing_Form.jsx
import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts, incrementFormEntry  } from '../../ui/api';
import axios from 'axios';
import VenderNameModal from '../../ui/VenderNameModal';

const BANK_OPTIONS = [
    { value: "UBL M.A.R", label: "UBL M.A.R" },
    { value: "UBL F.Z", label: "UBL F.Z" },
    { value: "HBL M.A.R", label: "HBL M.A.R" },
    { value: "HBL F.Z", label: "HBL F.Z" },
    { value: "JAZ C", label: "JAZ C" },
    { value: "MCB FIT", label: "MCB FIT" },
];

// Status options for the new status field
const STATUS_OPTIONS = [
    { value: "Processing", label: "Processing" },
    { value: "Complete", label: "Complete" },
    { value: "Deliver", label: "Deliver" },
];

// Auto-calculation component for visa processing form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();
    
    useEffect(() => {
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const additionalCharges = parseFloat(values.additional_charges) || 0;
        const payForProtector = parseFloat(values.pay_for_protector) || 0;
        
        // Calculate total payable to all vendors
        const totalPayableToVendors = values.vendors?.reduce((sum, vendor) => {
            return sum + (parseFloat(vendor.payable_amount) || 0);
        }, 0) || 0;
        
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);
        
        const profit = totalPayableToVendors > 0 ? receivable - totalPayableToVendors : receivable - additionalCharges - payForProtector;
        setFieldValue('profit', profit);
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.additional_charges,
        values.pay_for_protector,
        values.vendors,
        setFieldValue
    ]);
    
    return null;
};

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
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                                        className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <ErrorMessage name={`vendors[${index}].vendor_name`} component="p" className="mt-1 text-sm text-red-500" />
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
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={editEntry}
                                    />
                                    {values.vendors.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVendor(index)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                                <ErrorMessage name={`vendors[${index}].payable_amount`} component="p" className="mt-1 text-sm text-red-500" />
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

const VisaProcessing_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

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
        expiry_medical_date: '',
        passport_deliver_date: '',
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
        additional_charges: '',
        pay_for_protector: '',
        paid_cash: '',
        bank_title: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: '',
        detail: '', // New Detail field
        status: 'Processing', // Default status for new entries
        agent_name: '',
        booking_date: '',
        remaining_date: '',
        vendors: [{ vendor_name: '', payable_amount: '' }]
    });

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        status: Yup.string().required('Status is required').oneOf(
            STATUS_OPTIONS.map(opt => opt.value),
            'Invalid status'
        ),
        vendors: Yup.array().of(
            Yup.object().shape({
                vendor_name: Yup.string().notRequired('Vendor name is required'),
                payable_amount: Yup.number().notRequired('Payable amount is required').min(0, 'Amount must be positive'),
            })
        ).min(1, 'At least one vendor is required'),
        receivable_amount: Yup.number().notRequired('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        paid_cash: Yup.number().notRequired().min(0, 'Paid Cash cannot be negative').typeError('Paid Cash must be a number'),
        paid_in_bank: Yup.number().notRequired().min(0, 'Paid In Bank cannot be negative').typeError('Paid In Bank must be a number'),
        bank_title: Yup.string().notRequired(),
        profit: Yup.number(),
        remaining_amount: Yup.number(),
        detail: Yup.string(), // Validation for new Detail field (optional)
    });

    useEffect(() => {
        const fetchNames = async () => {
            try {
                const [agentsRes, vendorsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/agent-names/existing`),
                    axios.get(`${BASE_URL}/vender-names/existing`),
                ]);
                if (agentsRes.data.status === 'success') {
                    setAgentNames(agentsRes.data.agentNames || []);
                }
                if (vendorsRes.data.status === 'success') {
                    setVendorNames(vendorsRes.data.vendorNames || []);
                }
            } catch (error) {
                console.error('Error fetching names:', error);
            }
        };
        fetchNames();
    }, []);

    useEffect(() => {
        if (!editEntry) {
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
        }
    }, [editEntry]);

    useEffect(() => {
    setFormInitialValues(prev => ({
        ...prev,
        employee_name: user?.username || '',
        entry: editEntry ? (editEntry.entry || '0/0') : `VS ${entryNumber}/${totalEntries}`
    }));
}, [user, editEntry, entryNumber, totalEntries]);

    useEffect(() => {
        if (editEntry) {
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passport_detail === 'string') {
                    try {
                        parsedPassportDetails = JSON.parse(editEntry.passport_detail);
                    } catch(e) {
                        console.error("Error parsing passport details:", e);
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

            // Parse vendor data
            let vendorsData = [{ vendor_name: '', payable_amount: '' }];
            if (editEntry.vendor_name && editEntry.payable_to_vendor) {
                vendorsData = [{ 
                    vendor_name: editEntry.vendor_name, 
                    payable_amount: editEntry.payable_to_vendor 
                }];
            }

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
                expiry_medical_date: formatDate(editEntry.expiry_medical_date),
                passport_deliver_date: formatDate(editEntry.passport_deliver_date),
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
                additional_charges: editEntry.additional_charges || '',
                pay_for_protector: editEntry.pay_for_protector || '',
                paid_cash: editEntry.paid_cash || '',
                bank_title: editEntry.bank_title || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '',
                detail: editEntry.detail || '', // Load Detail field for edit
                status: editEntry.status || 'Processing',
                agent_name: editEntry.agent_name || '',
                vendors: vendorsData,
                booking_date: formatDate(editEntry.booking_date),
                remaining_date: formatDate(editEntry.remaining_date),
            };
            
            setFormInitialValues(newValues);
            console.log("Loaded edit values:", newValues);
        }
    }, [editEntry, user]);

    const handleVendorAdded = (newVendor) => {
        if (newVendor && newVendor.name && !vendorNames.includes(newVendor.name)) {
            setVendorNames(prev => [...prev, newVendor.name]);
        }
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

        // Calculate total payable to vendors
        const totalPayableToVendor = values.vendors.reduce((sum, vendor) => {
            return sum + (parseFloat(vendor.payable_amount) || 0);
        }, 0);

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
            embassy_send_date: values.embassy_send_date ? new Date(values.embassy_send_date) : null,
            embassy_return_date: values.embassy_return_date ? new Date(values.embassy_return_date) : null,
            protector_date: values.protector_date ? new Date(values.protector_date) : null,
            expiry_medical_date: values.expiry_medical_date ? new Date(values.expiry_medical_date) : null,
            passport_deliver_date: values.passport_deliver_date ? new Date(values.passport_deliver_date) : null,
            receivable_amount: parseFloat(values.receivable_amount) || 0,
            additional_charges: parseFloat(values.additional_charges) || 0,
            pay_for_protector: parseFloat(values.pay_for_protector) || 0,
            paid_cash: parseFloat(values.paid_cash) || 0,
            paid_in_bank: parseFloat(values.paid_in_bank) || 0,
            profit: parseFloat(values.profit) || 0,
            remaining_amount: parseFloat(values.remaining_amount) || 0,
            detail: values.detail || '', // Include Detail field in submission
            status: values.status,
            agent_name: values.agent_name,
            payable_to_vendor: totalPayableToVendor,
            vendor_name: values.vendors.map(v => v.vendor_name).join(', '),
            vendors_detail: JSON.stringify(values.vendors),
            booking_date: values.booking_date ? new Date(values.booking_date) : null,
            remaining_date: values.remaining_date ? new Date(values.remaining_date) : null,
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

            if (!editEntry) {
                // Submit vendor data for each vendor
                 const parsedEntryNumber = parseInt(values.entry.replace('VS ', '').split('/')[0]);
    await incrementFormEntry('visa', parsedEntryNumber);
    
                for (const vendor of values.vendors) {
                    if (vendor.vendor_name && vendor.payable_amount) {
                        const vendorData = {
                            vender_name: vendor.vendor_name,
                            detail: values.detail || `Visa Processing - ${values.passengerFirstName} ${values.passengerLastName} - ${values.reference}`,
                            credit: parseFloat(vendor.payable_amount) || 0,
                            date: new Date().toISOString().split('T')[0],
                            entry: values.entry,
                            bank_title: values.bank_title,
                            debit: null
                        };
                        const vendorResponse = await fetch(`${BASE_URL}/vender`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(vendorData),
                        });
                        if (!vendorResponse.ok) console.error('Vendor submission failed:', vendorResponse.status);
                    }
                }

                // Submit agent data
                if (values.agent_name) {
                    const agentData = {
                        agent_name: values.agent_name,
                        employee: values.employee_name,
                        detail: values.detail || `Visa Processing - ${values.passengerFirstName} ${values.passengerLastName} - ${values.reference}`,
                        receivable_amount: parseFloat(values.receivable_amount) || 0,
                        paid_cash: parseFloat(values.paid_cash) || 0,
                        paid_bank: parseFloat(values.paid_in_bank) || 0,
                        credit: parseFloat(values.remaining_amount) || 0,
                        date: new Date().toISOString().split('T')[0],
                        entry: values.entry,
                        bank_title: values.bank_title,
                        debit: null
                    };
                    const agentResponse = await fetch(`${BASE_URL}/agent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(agentData),
                    });
                    if (!agentResponse.ok) console.error('Agent submission failed:', agentResponse.status);
                }
            }

            if (parseFloat(values.paid_in_bank) > 0 && values.bank_title) {
                const bankData = {
                    bank_name: values.bank_title,
                    employee_name: values.employee_name,
                    detail: values.detail || `Visa Sale - ${values.passengerFirstName} ${values.passengerLastName} - ${values.reference}`,
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
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: 'Select booking date', icon: 'calendar-check' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true }, 
        { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.map(opt => opt.value), placeholder: 'Select status', icon: 'tasks' },
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

    const section2Fields = [
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Dr'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'Full Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Father Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        { name: 'documentNo', label: 'Passsport No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
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
                { name: 'detail', label: 'Additional Detail', type: 'text', placeholder: 'Enter detail', icon: 'info-circle' }, // New Detail field      
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'pay_for_protector', label: 'Expence Emigrant', type: 'number', placeholder: 'Enter pay for protector', icon: 'shield-alt' },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'bank_title', label: 'Bank Title', type: 'select', options: BANK_OPTIONS.map(opt => opt.value), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment amount', icon: 'university' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: true },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date', placeholder: 'Expected delivery / remaining date', icon: 'clock' },
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
                ) : field.type === 'vendor_select' ? (
                    <div className="flex items-center gap-2">
                        <Field
                            as="select"
                            id={field.name}
                            name={field.name}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">{field.placeholder}</option>
                            {field.options && field.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </Field>
                        <button
                            type="button"
                            onClick={() => setIsVendorModalOpen(true)}
                            className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
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
                            {editEntry ? 'Update Visa Processing' : 'New Visa Processing'}
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
                                {activeSection === 3 && section3Fields.map(renderField)}
                                {activeSection === 4 && (
                                    <>
                                        {section4Fields.map(renderField)}
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
                                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </motion.button>
                                    
                                    {activeSection < 4 ? (
                                        <motion.button
                                            type="button"
                                            onClick={() => setActiveSection(activeSection + 1)}
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Next <i className="fas fa-arrow-right ml-2"></i>
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
            <VenderNameModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onVenderAdded={handleVendorAdded}
            />
        </div>
    );
};

export default VisaProcessing_Form;