import React, { useEffect, useState, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

// --- Auto-calculation component ---
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


const GamcaToken_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);

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
            agent_name: '',
            profit: '',
            remaining_amount: '0',
            payFromBankCard: 'Card Payment',
            card_amount: '',
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
                agent_name: editEntry.agent_name || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '0',
                payFromBankCard: editEntry.payFromBankCard || '',
                card_amount: editEntry.card_amount || '',
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
        agent_name: Yup.string().notRequired(),
        profit: Yup.number().typeError('Profit must be a number').notRequired(),
        remaining_amount: Yup.number().typeError('Remaining Amount must be a number').notRequired(),
        payFromBankCard: Yup.string().notRequired(),
        card_amount: Yup.number().notRequired().typeError('Must be a number'),
    });

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

    // Fetch agent & vendor names
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [countsRes, agentRes] = await Promise.all([
                    fetchEntryCounts(),
                    axios.get(`${BASE_URL}/agent-names/existing`),
                ]);

                const gamcaCounts = countsRes.find(c => c.form_type === 'gamca');
                if (gamcaCounts) {
                    setEntryNumber(gamcaCounts.current_count + 1);
                    setTotalEntries(gamcaCounts.global_count + 1);  // +1 for the next entry
                }

                if (agentRes.data.status === 'success') setAgentNames(agentRes.data.agentNames || []);
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };

        loadInitialData();
    }, [BASE_URL]);

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
            agent_name: values.agent_name || null,
            profit: parseFloat(values.profit) || 0,
            remaining_amount: parseFloat(values.remaining_amount) || 0,
            pay_from_bank_card: values.payFromBankCard || null,
            card_amount: parseFloat(values.card_amount) || 0,
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
                    detail: `Gamca Sale - ${values.passengerFirstName} - ${values.passengerLastName}`,
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

            // ✅ UPDATED: Removed manual increment call - backend handles it automatically
            if (!editEntry) {
                // Just refresh the entry counts to get the updated numbers
                if (counts) {
                    const gamcaCounts = counts.find(c => c.form_type === 'gamca');
                    if (gamcaCounts) {
                        setEntryNumber(gamcaCounts.current_count + 1);
                        setTotalEntries(gamcaCounts.global_count);
                    }
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

    const formFields = [
        // Basic Info
        { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'customer_add', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country', icon: 'globe' },
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: '', icon: 'calendar-check' },
        // Passport Details
        { name: 'passengerTitle', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Dr'], placeholder: 'Select title', icon: 'user-tag' },
        { name: 'passengerFirstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', icon: 'user' },
        { name: 'passengerLastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', icon: 'user' },
        { name: 'passengerDob', label: 'Date of Birth', type: 'date', placeholder: 'Select date of birth', icon: 'calendar' },
        { name: 'documentNo', label: 'Passport No', type: 'text', placeholder: 'Enter document number', icon: 'passport' },
        { name: 'documentExpiry', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date', icon: 'calendar-times' },
        // Payment Details
        { name: 'receivable_amount', label: 'Receivable Amount', type: 'number', placeholder: 'Enter receivable amount', icon: 'hand-holding-usd', readOnly: !!editEntry },
        { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave', readOnly: !!editEntry },
        { name: 'paid_from_bank', label: 'Bank Title', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment', icon: 'university', readOnly: !!editEntry },
        { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Auto-calculated', icon: 'chart-line', readOnly: !!editEntry },
        { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Auto-calculated', icon: 'balance-scale', readOnly: true },
        { name: 'remaining_date', label: 'Remaining Date', type: 'date', placeholder: '', icon: 'calendar-times' },
        { name: 'payFromBankCard', label: 'Pay from Bank Card', type: 'select', options: cardBankOptions.map(opt => opt.label), placeholder: 'Select bank card', icon: 'credit-card' },
        { name: 'card_amount', label: 'Card Amount', type: 'number', placeholder: 'Enter Card Amount', icon: 'dollar-sign' },
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

                            <div className="flex justify-end mt-8 pt-4 border-t space-x-3">
                                <button type="button" onClick={onCancel} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg" disabled={isSubmitting}>
                                    {isSubmitting && <ButtonSpinner />}
                                    {editEntry ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

        </div>
    );
};

export default GamcaToken_Form;