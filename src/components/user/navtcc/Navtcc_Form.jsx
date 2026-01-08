import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

// Auto-calculation component for navtcc form
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const receivable = parseFloat(values.receivable_amount) || 0;
        const cashPaid = parseFloat(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const cardAmount = parseFloat(values.card_amount) || 0;

        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining.toFixed(2));

        const profit = receivable - cardAmount;
        setFieldValue('profit', profit ? profit.toFixed(2) : '');
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.card_amount,
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
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
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
        paid_from_bank: '',
        paid_in_bank: '',
        payed_to_bank: '',
        agent_name: '',
        profit: '',
        booking_date: new Date().toISOString().split('T')[0],  // Default today
        remaining_date: '',
        remaining_amount: '0',

        payFromBankCard: 'Card Payment',
        card_amount: '',
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
        passengerNationality: Yup.string().notRequired('Nationality is required'),
        documentType: Yup.string().required('Document Type is required'),
        documentNo: Yup.string().required('Document Number is required'),
        documentExpiry: Yup.date().notRequired('Expiry Date is required').typeError('Invalid date'),
        documentIssueCountry: Yup.string().notRequired('Issue Country is required'),
        receivable_amount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        paid_cash: Yup.number().required('Paid Cash is required').typeError('Paid Cash must be a number'),
        paid_in_bank: Yup.number().required('Paid In Bank is required').typeError('Paid In Bank must be a number'),
        paid_from_bank: Yup.string().required('Paid From Bank is required'),
        payed_to_bank: Yup.number().required('Payed To Bank is required').typeError('Payed To Bank must be a number'),
        agent_name: Yup.string().notRequired(),
        profit: Yup.number(),
        remaining_amount: Yup.number(),
        payFromBankCard: Yup.string().notRequired(),
        card_amount: Yup.number().notRequired().typeError('Must be a number'),
    });

    // Fetch agent names
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [agentRes] = await Promise.all([
                    axios.get(`${BASE_URL}/agent-names/existing`),
                ]);

                if (agentRes.data.status === 'success') {
                    setAgentNames(agentRes.data.agentNames || []);
                }
            } catch (error) {
                console.error('Error fetching names:', error);
            }
        };
        fetchData();
    }, [BASE_URL]);

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
                entry: editEntry ? editEntry.entry : `NV ${entryNumber}/${totalEntries}`
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

            const newValues = {
                employee_name: editEntry.employee_name || user?.username || '',
                entry: editEntry.entry || `NV ${entryNumber}/${totalEntries}`,
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
                profit: editEntry.profit || '',
                booking_date: formatDate(editEntry.booking_date) || new Date().toISOString().split('T')[0],
                remaining_date: formatDate(editEntry.remaining_date) || '',
                remaining_amount: editEntry.remaining_amount || '',

                payFromBankCard: editEntry.payFromBankCard || '',
                card_amount: editEntry.card_amount || '',
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

        const passengerName = `${values.passengerFirstName} ${values.passengerLastName}`.trim();
        const passportNumber = values.documentNo || '';
        const agentName = values.agent_name || '';
        const referenceToStore = values.agent_name ? '' : (values.reference || '');
        const detail = `${agentName} / ${passengerName} / ${passportNumber} / ${referenceToStore}`;

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
            profit: parseInt(values.profit),
            booking_date: values.booking_date,
            remaining_date: values.remaining_date || null,
            remaining_amount: parseInt(values.remaining_amount),
            payFromBankCard: values.payFromBankCard || null,
            card_amount: parseFloat(values.card_amount) || 0,
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
            const counts = await fetchEntryCounts();

            // Card payment transaction
            if (parseFloat(values.card_amount) > 0 && values.payFromBankCard) {
                const bankCounts = counts.find(c => c.form_type === 'bank-detail');
                const bankEntryNumber = bankCounts ? bankCounts.current_count + 1 : 1;
                const bankTotalEntries = bankCounts ? bankCounts.global_count + 1 : 1;

                const bankDetailData = {
                    date: values.booking_date,
                    entry: `BD ${bankEntryNumber}/${bankTotalEntries}`,
                    employee: values.employee_name,
                    detail: detail,
                    credit: 0,
                    debit: parseFloat(values.card_amount) || 0,
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

            // Submit to accounts if bank payment exists
            if (parseFloat(values.paid_in_bank) > 0 && values.paid_from_bank) {
                const bankData = {
                    bank_name: values.paid_from_bank,
                    employee_name: values.employee_name,
                    detail: detail,
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

            // Submit to agent if agent details exist
            if (values.agent_name) {
                const agentData = {
                    agent_name: values.agent_name,
                    employee: values.employee_name,
                    detail: detail,
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

    const cardBankOptions = [
        { value: "Card Payment", label: "Card Payment" },
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

    const formFields = [
        { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'booking_date', label: 'Booking Date', type: 'date' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'profession_key', label: 'Profession Key', type: 'text', placeholder: 'Enter Profession key', icon: 'plane' },
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'CH','INF'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        { name: 'documentType', label: 'Document Type', type: 'select', options: ['Passport'], placeholder: 'Select document type', icon: 'id-card' },
        { name: 'documentNo', label: 'Passport No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
        { name: 'receivable_amount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd', readOnly: !!editEntry },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave', readOnly: !!editEntry },
        { name: 'paid_from_bank', label: 'Bank Title', type: 'select', options: bankOptions.map(option => option.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment details', icon: 'university', readOnly: !!editEntry },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'payed_to_bank', label: 'Payed To Bank', type: 'number', placeholder: 'Enter amount paid to bank', icon: 'university', readOnly: !!editEntry },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Auto-calculated', icon: 'chart-line', readOnly: true },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Auto-calculated', icon: 'balance-scale', readOnly: true },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date', placeholder: '', icon: 'calendar-times' },

        { name: 'payFromBankCard', label: 'Pay from Bank Card', type: 'select', options: cardBankOptions.map(opt => opt.label), placeholder: 'Select bank card', icon: 'credit-card' },
        { name: 'card_amount', label: 'Card Amount', type: 'number', placeholder: 'Enter Card Amount', icon: 'dollar-sign' },
    ];

    const renderField = (field) => (
        <motion.div key={field.name} className="mb-4" variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.name === 'customer_add' || field.name === 'reference' || field.name === 'profession_key' || field.name === 'passengerFirstName' || field.name === 'passengerLastName' || field.name === 'passengerDob' || field.name === 'documentNo' || field.name === 'receivable_amount' || field.name === 'paid_cash' || field.name === 'paid_in_bank' || field.name === 'paid_from_bank' || field.name === 'payed_to_bank' ? <span className="text-red-500">*</span> : null}
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
                            {editEntry ? 'Update NAVTCC' : 'New NAVTCC'}
                        </motion.h2>
                        <motion.p className="text-indigo-600 mt-1">Please fill in the details</motion.p>
                    </div>
                    <button type="button" onClick={onCancel} className="text-black hover:text-gray-600 ml-4">
                        ✕
                    </button>
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

                            <div className="flex justify-end mt-8 pt-4 border-t">
                                <div className="flex space-x-3">
                                    <button type="button" onClick={onCancel} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg" disabled={isSubmitting}>
                                        {isSubmitting && <ButtonSpinner />}
                                        {editEntry ? 'Update' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

        </div>
    );
};

export default Navtcc_Form;