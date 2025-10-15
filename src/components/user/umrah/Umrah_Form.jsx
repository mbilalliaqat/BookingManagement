import React, { useEffect, useState, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

const PASSENGER_TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr'];
const DOCUMENT_TYPE_OPTIONS = ['Passport', 'National ID'];

const DEFAULT_PASSENGER_DETAIL = {
    title: 'Mr',
    firstName: '',
    lastName: '',
    dob: '',
    nationality: '',
    documentType: 'Passport',
    documentNo: '',
    documentExpiry: '',
    issueCountry: '',
    mobileNo: ''
};

const formatDateForInput = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === '' || dateStr === '0000-00-00' || String(dateStr).startsWith('1970-01-01')) {
        return '';
    }
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
};

const ErrorText = ({ name }) => (
    <ErrorMessage
        name={name}
        component="p"
        className="mt-1 text-sm text-red-500 flex items-center"
    >
        {(msg) => (
            <span className="flex items-center text-red-500">
                <i className="fas fa-exclamation-circle mr-1 text-red-500"></i> {msg}
            </span>
        )}
    </ErrorMessage>
);

const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const receivable = parseFloat(values.receivableAmount) || 0;
        const cashPaid = parseFloat(values.paidCash) || 0;
        const bankPaid = parseFloat(values.paidInBank) || 0;
        const payableToVendor = parseFloat(values.payableToVendor) || 0;

        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remainingAmount', remaining.toFixed(2));

        const profit = payableToVendor > 0 ? receivable - payableToVendor : '';
        setFieldValue('profit', profit ? profit.toFixed(2) : '');
    }, [
        values.receivableAmount,
        values.paidCash,
        values.paidInBank,
        values.payableToVendor,
        setFieldValue
    ]);

    return null;
};

const PassengerDetailsFields = ({ index, fieldPrefix }) => (
    <motion.div
        key={index}
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
        }}
        className="border p-4 rounded-md mb-4 bg-gray-50"
    >
        <h4 className="text-lg font-semibold mb-3 text-purple-700">Passenger {index + 1} Details</h4>
        {([
            { label: 'Title', name: 'title', as: 'select', options: PASSENGER_TITLE_OPTIONS, placeholder: 'Select title' },
            { label: 'First Name', name: 'firstName', type: 'text', placeholder: 'Enter first name' },
            { label: 'Last Name', name: 'lastName', type: 'text', placeholder: 'Enter last name' },
            { label: 'Document Type', name: 'documentType', as: 'select', options: DOCUMENT_TYPE_OPTIONS, placeholder: 'Select document type' },
            { label: 'Document No', name: 'documentNo', type: 'text', placeholder: 'Enter document number' },
            { label: 'Mobile No', name: 'mobileNo', type: 'text', placeholder: 'Enter mobile number' },
            { label: 'Date of Birth', name: 'dob', type: 'date', placeholder: 'Select date of birth' },
            { label: 'Nationality', name: 'nationality', type: 'text', placeholder: 'Enter nationality' },
            { label: 'Expiry Date', name: 'documentExpiry', type: 'date', placeholder: 'Select expiry date' },
            { label: 'Issue Country', name: 'issueCountry', type: 'text', placeholder: 'Enter issue country' },
        ]).map(field => (
            <div className="mb-4" key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`${fieldPrefix}.${field.name}`}>
                    {field.label}
                </label>
                {field.as === 'select' ? (
                    <Field
                        as="select"
                        id={`${fieldPrefix}.${field.name}`}
                        name={`${fieldPrefix}.${field.name}`}
                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                        <option value="">{field.placeholder}</option>
                        {field.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Field>
                ) : (
                    <Field
                        id={`${fieldPrefix}.${field.name}`}
                        type={field.type}
                        name={`${fieldPrefix}.${field.name}`}
                        placeholder={field.placeholder}
                        className="w-full border border-gray-300 rounded-md px-3 py-1"
                    />
                )}
                <ErrorText name={`${fieldPrefix}.${field.name}`} />
            </div>
        ))}
    </motion.div>
);

const PassengerCountSlider = ({ values, setFieldValue, setShowPassengerSlider }) => {
    const handleCountChange = useCallback((type, delta) => {
        const newCount = Math.max(0, (values[type] || 0) + delta);
        setFieldValue(type, newCount);

        const totalPassengers = (type === 'adults' ? newCount : values.adults) +
                               (type === 'children' ? newCount : values.children) +
                               (type === 'infants' ? newCount : values.infants);

        const currentPassengers = values.passengers || [];
        const updatedPassengers = [...currentPassengers];

        if (totalPassengers > updatedPassengers.length) {
            const diff = totalPassengers - updatedPassengers.length;
            for (let i = 0; i < diff; i++) {
                updatedPassengers.push({ ...DEFAULT_PASSENGER_DETAIL });
            }
        } else if (totalPassengers < updatedPassengers.length) {
            updatedPassengers.splice(totalPassengers);
        }
        setFieldValue('passengers', updatedPassengers);
    }, [values, setFieldValue]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg p-4 mt-1 w-64 right-0"
        >
            <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Adults (12+ yrs)</span>
                <div className="flex items-center">
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('adults', -1)}>
                        <i className="fas fa-minus"></i>
                    </button>
                    <span className="mx-3 font-semibold">{values.adults}</span>
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('adults', 1)}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Children (2-12 yrs)</span>
                <div className="flex items-center">
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('children', -1)}>
                        <i className="fas fa-minus"></i>
                    </button>
                    <span className="mx-3 font-semibold">{values.children}</span>
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('children', 1)}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700">Infant (Under 2 yrs)</span>
                <div className="flex items-center">
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('infants', -1)}>
                        <i className="fas fa-minus"></i>
                    </button>
                    <span className="mx-3 font-semibold">{values.infants}</span>
                    <button type="button" className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100" onClick={() => handleCountChange('infants', 1)}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div className="text-right mt-4">
                <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => setShowPassengerSlider(false)}>
                    Done
                </button>
            </div>
        </motion.div>
    );
};

const MultiSelectVendor = ({ field, form, options, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendors, setSelectedVendors] = useState(field.value || []);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectVendor = (vendor) => {
        const newSelected = selectedVendors.includes(vendor)
            ? selectedVendors.filter(v => v !== vendor)
            : [...selectedVendors, vendor];
        setSelectedVendors(newSelected);
        form.setFieldValue(field.name, newSelected);
    };

    const removeVendor = (vendor) => {
        const newSelected = selectedVendors.filter(v => v !== vendor);
        setSelectedVendors(newSelected);
        form.setFieldValue(field.name, newSelected);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            
            {/* Selected Vendors Display */}
            <div className="border border-gray-300 rounded-md p-2 mb-2 min-h-[40px]">
                {selectedVendors.length === 0 ? (
                    <span className="text-gray-500">{placeholder}</span>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {selectedVendors.map((vendor) => (
                            <span
                                key={vendor}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                            >
                                {vendor}
                                <button
                                    type="button"
                                    onClick={() => removeVendor(vendor)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Dropdown Toggle */}
            <div
                className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer bg-white flex justify-between items-center relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-gray-700">
                    {selectedVendors.length > 0 
                        ? `${selectedVendors.length} vendor(s) selected` 
                        : 'Click to select vendors'
                    }
                </span>
                <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`}></i>
            </div>

            {/* Dropdown Options */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                    {/* Search Input */}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search vendors..."
                        className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                    />
                    
                    {/* Options */}
                    <div className="py-2">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500">No vendors found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                                        selectedVendors.includes(option) ? 'bg-blue-50 text-blue-600' : ''
                                    }`}
                                    onClick={() => handleSelectVendor(option)}
                                >
                                    <span>{option}</span>
                                    {selectedVendors.includes(option) ? (
                                        <i className="fas fa-check text-blue-600"></i>
                                    ) : (
                                        <i className="fas fa-square text-gray-400"></i>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
            
            {/* Error Message */}
            <ErrorMessage
                name={field.name}
                component="p"
                className="mt-1 text-sm text-red-500"
            />
        </div>
    );
};

const Umrah_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [showPassengerSlider, setShowPassengerSlider] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [vendorNames, setVendorNames] = useState([]);
    const [agentNames, setAgentNames] = useState([]);
    const [originalPayments, setOriginalPayments] = useState({ paidCash: 0, paidInBank: 0 });

    const bankOptions = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" }
    ];

    const [formInitialValues, setFormInitialValues] = useState({
        userName: user?.username || '',
        agentName: '',
        customerAdd: '',
        reference: '',
        booking_date: new Date().toISOString().split('T')[0],
        entry: '0/0',
        packageDetail: '',
        depart_date: '',
        return_date: '',
        sector: '',
        airline: '',
        adults: 1,
        children: 0,
        infants: 0,
        passengers: [{ ...DEFAULT_PASSENGER_DETAIL }],
        receivableAmount: '',
        paidCash: '',
        bank_title: '',
        paidInBank: '',
        payableToVendor: '',
        vendorName: [],
        profit: '',
        remainingAmount: '0'
    });

    const validationSchema = Yup.object({
        userName: Yup.string().required('Employee Name is required'),
        booking_date: Yup.date().required('Booking Date is required').typeError('Invalid date'),
        customerAdd: Yup.string().required('Customer Address is required'),
        reference: Yup.string().required('Reference is required'),
        packageDetail: Yup.string().required('Package Detail is required'),
        depart_date: Yup.date().required('Depart Date is required').typeError('Invalid date'),
        return_date: Yup.date().required('Return Date is required').typeError('Invalid date'),
        sector: Yup.string().required('Sector is required'),
        airline: Yup.string().required('Airline is required'),
        adults: Yup.number().required('Adults is required').min(0, 'Adults cannot be negative'),
        children: Yup.number().required('Children is required').min(0, 'Children cannot be negative'),
        infants: Yup.number().required('Infants is required').min(0, 'Infants cannot be negative'),
        passengers: Yup.array().of(
            Yup.object().shape({
                title: Yup.string().required('Title is required'),
                firstName: Yup.string().required('First Name is required'),
                lastName: Yup.string().required('Last Name is required'),
                dob: Yup.date().required('Date of Birth is required').typeError('Invalid date'),
                nationality: Yup.string().required('Nationality is required'),
                documentType: Yup.string().required('Document Type is required'),
                documentNo: Yup.string().required('Document Number is required'),
                documentExpiry: Yup.date().required('Expiry Date is required').typeError('Invalid date'),
                issueCountry: Yup.string().required('Issue Country is required'),
            })
        ).test(
            'has-passenger-details',
            'At least one passenger detail is required if passenger count is greater than 0',
            function(value) {
                const { adults, children, infants } = this.parent;
                const totalPassengers = adults + children + infants;
                if (totalPassengers > 0 && (!value || value.length === 0)) {
                    return false;
                }
                return true;
            }
        ),
        receivableAmount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        paidCash: Yup.number().required('Paid Cash is required').typeError('Paid Cash must be a number'),
        bank_title: Yup.string().required('Bank Title is required'),
        paidInBank: Yup.number().required('Paid In Bank is required').typeError('Paid In Bank must be a number'),
        payableToVendor: Yup.number().required('Payable To Vendor is required').typeError('Payable To Vendor must be a number'),
        vendorName: Yup.array().min(1, 'At least one vendor must be selected').required('Vendor Name is required'),
        profit: Yup.number(),
        remainingAmount: Yup.number()
    });

    useEffect(() => {
        const fetchNames = async () => {
            try {
                const [vendorRes, agentRes] = await Promise.all([
                    axios.get(`${BASE_URL}/vender-names/existing`),
                    axios.get(`${BASE_URL}/agent-names/existing`)
                ]);
                if (vendorRes.data.status === 'success') {
                    setVendorNames(vendorRes.data.vendorNames || []);
                }
                if (agentRes.data.status === 'success') {
                    setAgentNames(agentRes.data.agentNames || []);
                }
            } catch (error) {
                console.error('Error fetching names:', error);
            }
        };
        fetchNames();

        const getCounts = async () => {
            if (!editEntry) {
                const umrahCounts = await fetchEntryCounts('umrah');
                setEntryNumber((umrahCounts?.global_count || 0) + 1);
                setTotalEntries((umrahCounts?.global_count || 0) + 1);
            } else {
                setEntryNumber(parseInt(editEntry.entry.split('/')[0]));
                setTotalEntries(parseInt(editEntry.entry.split('/')[1]));
                setOriginalPayments({
                    paidCash: parseFloat(editEntry.paidCash) || 0,
                    paidInBank: parseFloat(editEntry.paidInBank) || 0
                });
                setFormInitialValues({
                    userName: editEntry.userName || '',
                    agentName: editEntry.agent_name || '',
                    customerAdd: editEntry.customerAdd || '',
                    reference: editEntry.reference || '',
                    booking_date: formatDateForInput(editEntry.booking_date),
                    entry: editEntry.entry || '0/0',
                    packageDetail: editEntry.packageDetail || '',
                    depart_date: formatDateForInput(editEntry.depart_date),
                    return_date: formatDateForInput(editEntry.return_date),
                    sector: editEntry.sector || '',
                    airline: editEntry.airline || '',
                    adults: editEntry.adults || 1,
                    children: editEntry.children || 0,
                    infants: editEntry.infants || 0,
                    passengers: JSON.parse(editEntry.passportDetail) || [{ ...DEFAULT_PASSENGER_DETAIL }],
                    receivableAmount: editEntry.receivableAmount || '',
                    paidCash: editEntry.paidCash || '',
                    bank_title: editEntry.bank_title || '',
                    paidInBank: editEntry.paidInBank || '',
                    payableToVendor: editEntry.payableToVendor || '',
                    vendorName: typeof editEntry.vendorName === 'string' ? editEntry.vendorName.split(',') : editEntry.vendorName || [],
                    profit: editEntry.profit || '',
                    remainingAmount: editEntry.remainingAmount || '0'
                });
            }
        };
        getCounts();
    }, [editEntry, user]);

    useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            entry: `Umrah ${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries]);

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        setSubmitting(true);
        const passportDetail = JSON.stringify(values.passengers.map(p => ({
            title: p.title, firstName: p.firstName, lastName: p.lastName, dob: p.dob,
            nationality: p.nationality, documentType: p.documentType, documentNo: p.documentNo,
            documentExpiry: p.documentExpiry, issueCountry: p.issueCountry, mobileNo: p.mobileNo
        })));

        try {
            const entryValueToSubmit = editEntry ? editEntry.entry : `Umrah ${entryNumber}/${totalEntries}`;
            const parsedEntryNumber = parseInt(entryValueToSubmit.replace('Umrah ', '').split('/')[0]);

            const vendorNamesArray = Array.isArray(values.vendorName) ? values.vendorName : [];
            const vendorNamesString = vendorNamesArray.join(',');

            const requestData = {
                userName: values.userName,
                agent_name: values.agentName || null,
                customerAdd: values.customerAdd,
                reference: values.reference,
                entry: entryValueToSubmit,
                packageDetail: values.packageDetail || null,
                depart_date: values.depart_date || null,
                return_date: values.return_date || null,
                sector: values.sector,
                airline: values.airline,
                adults: values.adults,
                children: values.children,
                infants: values.infants,
                passportDetail: passportDetail,
                receivableAmount: parseFloat(values.receivableAmount) || 0,
                paidCash: parseFloat(values.paidCash) || 0,
                bank_title: values.bank_title || null,
                paidInBank: parseFloat(values.paidInBank) || 0,
                payableToVendor: parseFloat(values.payableToVendor) || 0,
                vendorName: vendorNamesString || null,
                profit: parseFloat(values.profit) || 0,
                remainingAmount: parseFloat(values.remainingAmount) || 0,
                booking_date: values.booking_date || null,
            };

            const url = editEntry ? `${BASE_URL}/umrah/${editEntry.id}` : `${BASE_URL}/umrah`;
            const method = editEntry ? 'PUT' : 'POST';

            const umrahResponse = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!umrahResponse.ok) throw new Error(`HTTP error! status: ${umrahResponse.status}`);
            const umrahData = await umrahResponse.json();

            if (!editEntry) {
                await incrementEntryCounts('umrah', parsedEntryNumber);

                const commonDetail = [
                    values.packageDetail || '',
                    values.sector || '',
                    values.depart_date || '',
                    values.return_date || '',
                    values.airline || '',
                    `${values.passengers[0]?.firstName || ''} ${values.passengers[0]?.lastName || ''}`.trim()
                ].join(',');

                if (vendorNamesArray.length > 0) {
                    const totalPayable = parseFloat(values.payableToVendor) || 0;
                    const amountPerVendor = totalPayable / vendorNamesArray.length;

                    for (const vendorName of vendorNamesArray) {
                        const vendorData = {
                            vender_name: vendorName,
                            detail: commonDetail,
                            credit: amountPerVendor,
                            date: new Date().toISOString().split('T')[0],
                            entry: entryValueToSubmit,
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

                const agentData = {
                    agent_name: values.agentName,
                    employee: values.userName,
                    detail: commonDetail,
                    receivable_amount: parseFloat(values.receivableAmount) || 0,
                    paid_cash: parseFloat(values.paidCash) || 0,
                    paid_bank: parseFloat(values.paidInBank) || 0,
                    credit: parseFloat(values.remainingAmount) || 0,
                    date: new Date().toISOString().split('T')[0],
                    entry: entryValueToSubmit,
                    bank_title: values.bank_title,
                    debit: null
                };
                const agentResponse = await fetch(`${BASE_URL}/agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(agentData),
                });
                if (!agentResponse.ok) console.error('Agent submission failed:', agentResponse.status);

                if (values.bank_title && (parseFloat(values.paidInBank) || 0) > 0) {
                    const officeAccountDetail = `Customer: ${values.customerAdd}, Ref: ${values.reference || 'N/A'}, Agent: ${values.agentName || 'N/A'}`;
                    const officeAccountData = {
                        bank_name: values.bank_title,
                        employee_name: values.userName,
                        entry: entryValueToSubmit,
                        date: new Date().toISOString().split('T')[0],
                        detail: officeAccountDetail,
                        credit: parseFloat(values.paidInBank) || 0,
                        debit: 0,
                    };
                    try {
                        const officeAccountResponse = await axios.post(`${BASE_URL}/accounts`, officeAccountData);
                        if (officeAccountResponse.status !== 200 && officeAccountResponse.status !== 201) {
                            console.error('Office Account submission failed:', officeAccountResponse.status);
                        }
                    } catch (officeAccountError) {
                        console.error('Error submitting Office Account data:', officeAccountError.response?.data || officeAccountError.message);
                    }
                }
            } else {
                const newCash = parseFloat(values.paidCash) || 0;
                const newBank = parseFloat(values.paidInBank) || 0;
                const oldCash = parseFloat(originalPayments.paidCash) || 0;
                const oldBank = parseFloat(originalPayments.paidInBank) || 0;

                const cash_diff = newCash - oldCash;
                const bank_diff = newBank - oldBank;

                if (cash_diff > 0 || bank_diff > 0) {
                    const agentData = {
                        agent_name: values.agentName,
                        employee: values.userName,
                        detail: `Additional payment for Umrah ${editEntry.entry}`,
                        receivable_amount: 0,
                        paid_cash: cash_diff > 0 ? cash_diff : 0,
                        paid_bank: bank_diff > 0 ? bank_diff : 0,
                        credit: - (cash_diff + bank_diff),
                        date: new Date().toISOString().split('T')[0],
                        entry: editEntry.entry,
                        bank_title: values.bank_title,
                        debit: null
                    };
                    await fetch(`${BASE_URL}/agent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(agentData),
                    });
                }

                if (bank_diff > 0) {
                    const officeAccountData = {
                        bank_name: values.bank_title,
                        employee_name: values.userName,
                        entry: editEntry.entry,
                        date: new Date().toISOString().split('T')[0],
                        detail: `Customer: ${values.customerAdd}, Ref: ${values.reference || 'N/A'}`,
                        credit: bank_diff,
                        debit: 0,
                    };
                    try {
                        await axios.post(`${BASE_URL}/accounts`, officeAccountData);
                    } catch (error) {
                        console.error("Error submitting to office account:", error);
                    }
                }

                if (editEntry) {
                    // Logic to handle vendor payment updates in edit mode
                    const payableToVendor_New = parseFloat(values.payableToVendor) || 0;
                    const original_payableToVendor = parseFloat(editEntry.payableToVendor) || 0;
                    const vendorPayment_diff = payableToVendor_New - original_payableToVendor;

                    if (vendorPayment_diff !== 0) {
                        const amountPerVendor = vendorPayment_diff / vendorNamesArray.length;
                        for (const vendorName of vendorNamesArray) {
                            const vendorData = {
                                user_name: vendorName,
                                amount: amountPerVendor,
                                date: new Date().toISOString().split('T')[0],
                            };
                            try {
                                await fetch(`${BASE_URL}/vender`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(vendorData),
                                });
                            } catch (error) {
                                console.error(`Error updating vendor account for ${vendorName}:`, error);
                            }
                        }
                    }
                } else {
                    // Original logic for new entries
                    if (vendorNamesArray.length > 0 && parseFloat(values.payableToVendor) > 0) {
                        const totalPayable = parseFloat(values.payableToVendor);
                        const amountPerVendor = totalPayable / vendorNamesArray.length;
                        for (const vendorName of vendorNamesArray) {
                            const vendorData = {
                                user_name: vendorName,
                                amount: amountPerVendor,
                                date: new Date(),
                            };
                            try {
                                await fetch(`${BASE_URL}/vender`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(vendorData),
                                });
                            } catch (error) {
                                console.error(`Error submitting to vendor ${vendorName}:`, error);
                            }
                        }
                    }
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
        { name: 'userName', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
        { name: 'booking_date', label: 'Booking Date', type: 'date', placeholder: 'Enter booking date', icon: 'calendar-alt' },
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
        { name: 'customerAdd', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'packageDetail', label: 'Package Detail', type: 'text', placeholder: 'Enter package detail', icon: 'suitcase' },
        { name: 'depart_date', label: 'Depart Date', type: 'date', placeholder: 'Enter Depart date', icon: 'calendar-alt' },
        { name: 'return_date', label: 'Return Date', type: 'date', placeholder: 'Enter Return date', icon: 'calendar-alt' },
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
    ];

    const section3Fields = [
        { name: 'receivableAmount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd' },
        { name: 'agentName', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
        { name: 'paidCash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'bank_title', label: 'Bank Title', type: 'select', options: bankOptions.map(opt => opt.label), placeholder: 'Select bank title', icon: 'university' },
        { name: 'paidInBank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment amount', icon: 'university' },
        { name: 'payableToVendor', label: 'Payable To Vendor', type: 'number', placeholder: 'Enter payable to vendor', icon: 'user-tie' },
        { name: 'vendorName', label: 'Vendor Names', type: 'multi_select', options: vendorNames, placeholder: 'Select one or more vendors', icon: 'store' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: true },
        { name: 'remainingAmount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true }
    ];

   const renderField = (field, values, setFieldValue) => (
    <motion.div 
        key={field.name}
        className="mb-4"
        variants={itemVariants}
    >
        {/* Render label only for non-multi_select fields */}
        {field.type !== 'multi_select' && (
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={field.name}>
                {field.label}
            </label>
        )}
        <div className="relative">
            {field.type === 'multi_select' ? (
                <Field name={field.name}>
                    {({ field: formikField, form }) => (
                        <MultiSelectVendor
                            field={formikField}
                            form={form}
                            options={field.options}
                            label={field.label}
                            placeholder={field.placeholder}
                        />
                    )}
                </Field>
            ) : field.type === 'select' ? (
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
            ) : field.type === 'checkbox' ? (
                <div className="flex items-center">
                    <Field
                        id={field.name}
                        type="checkbox"
                        name={field.name}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={field.name} className="ml-2 block text-sm text-gray-700">
                        {field.label}
                    </label>
                </div>
            ) : field.type === 'custom_passenger' ? (
                <div
                    className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer bg-white flex justify-between items-center"
                    onClick={() => setShowPassengerSlider(!showPassengerSlider)}
                >
                    <span>{`${values.adults} Adults, ${values.children} Children, ${values.infants} Infants`}</span>
                    <i className="fas fa-chevron-down text-gray-400 text-sm"></i>
                </div>
            ) : (
                <Field
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    className={`w-full border border-gray-300 rounded-md px-3 py-1 ${field.readOnly ? 'bg-gray-100' : ''}`}
                    disabled={field.readOnly}
                    readOnly={field.readOnly}
                />
            )}

            {field.name === 'passengerCount' && showPassengerSlider && (
                <PassengerCountSlider values={values} setFieldValue={setFieldValue} setShowPassengerSlider={setShowPassengerSlider} />
            )}

            <ErrorText name={field.name} />
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
                            {editEntry ? 'Update Umrah Booking' : 'New Umrah Booking'}
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
                                step === activeSection ? 'text-purple-600' : 'text-gray-400'}
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
                                {activeSection === 2 && (
                                    <>
                                        {section2Fields.map(field => renderField(field, values, setFieldValue))}
                                        {values.passengers.map((_, index) => (
                                            <PassengerDetailsFields 
                                                key={index} 
                                                index={index} 
                                                fieldPrefix={`passengers[${index}]`} 
                                            />
                                        ))}
                                    </>
                                )}
                                {activeSection === 3 && section3Fields.map(field => renderField(field, values, setFieldValue))}
                            </motion.div>

                            {errors.general && (
                                <motion.div 
                                    className="text-red-500 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {errors.general}
                                </motion.div>
                            )}

                            {/* Navigation buttons */}
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
                                        className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </motion.button>
                                    
                                    {activeSection < 3 ? (
                                        <motion.button
                                            type="button"
                                            onClick={() => setActiveSection(activeSection + 1)}
                                            className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-md hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Next <i className="fas fa-arrow-right ml-2"></i>
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

export default Umrah_Form;