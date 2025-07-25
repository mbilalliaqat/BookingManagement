import { useEffect, useState, useCallback } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts, incrementFormEntry } from '../../ui/api';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

const PASSENGER_TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr'];
const DOCUMENT_TYPE_OPTIONS = ['Passport', 'National ID'];

const BANK_OPTIONS = [
    { value: "UBL M.A.R", label: "UBL M.A.R" },
    { value: "UBL F.Z", label: "UBL F.Z" },
    { value: "HBL M.A.R", label: "HBL M.A.R" },
    { value: "HBL F.Z", label: "HBL F.Z" },
    { value: "JAZ C", label: "JAZ C" },
    { value: "MCB FIT", label: "MCB FIT" }
];

const DEFAULT_PASSENGER_DETAIL = {
    title: '',
    firstName: '',
    lastName: '',
    dob: '',
    nationality: '',
    documentType: 'Passport',
    documentNo: '',
    documentExpiry: '',
    issueCountry: '',
};

const formatDateForInput = (dateStr) => {
    // Treat null, undefined, empty string, or common "zero" date strings as empty
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

// --- Formik Auto-calculation Component ---
const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const receivable = parseInt(values.receivable_amount) || 0;
        const cashPaid = parseInt(values.paid_cash) || 0;
        const bankPaid = parseFloat(values.paid_in_bank) || 0;
        const payableToVendor = parseInt(values.payable_to_vendor) || 0;

        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remaining_amount', remaining);

        const profit = payableToVendor > 0 ? receivable - payableToVendor : '';
        setFieldValue('profit', profit);
    }, [
        values.receivable_amount,
        values.paid_cash,
        values.paid_in_bank,
        values.payable_to_vendor,
        setFieldValue
    ]);

    return null;
};

// --- Passenger Details Sub-Component ---
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

// --- Passenger Count Slider Component ---
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

    const PassengerCounter = ({ label, type }) => (
        <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700">{label}</span>
            <div className="flex items-center">
                <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                    onClick={() => handleCountChange(type, -1)}
                >
                    <i className="fas fa-minus"></i>
                </button>
                <span className="mx-3 font-semibold">{values[type]}</span>
                <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
                    onClick={() => handleCountChange(type, 1)}
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg p-4 mt-1 w-64 right-0"
        >
            <PassengerCounter label="Adults (12+ yrs)" type="adults" />
            <PassengerCounter label="Children (2-12 yrs)" type="children" />
            <PassengerCounter label="Infant (Under 2 yrs)" type="infants" />
            <div className="text-right mt-4">
                <button
                    type="button"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => setShowPassengerSlider(false)}
                >
                    Done
                </button>
            </div>
        </motion.div>
    );
};

// --- Main Tickets_Form Component ---
const Tickets_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [showPassengerSlider, setShowPassengerSlider] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [agentNames, setAgentNames] = useState([]);
    const [vendorNames, setVendorNames] = useState([]);
    const [customerNames,setCustomerNames] = useState([]);

    // Form field definitions
    const formFields = {
        section1: [
            { name: 'employee_name', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', icon: 'user', readOnly: true },
            { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true },
            { name: 'customer_add', label: 'Add Customer', type: 'select',options:customerNames, placeholder: 'Select Customer Name', icon: 'address-card' },
            { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
            { name: 'depart_date', label: 'Depart Date', type: 'date', placeholder: 'Enter Depart date', icon: 'calendar-alt' },
            { name: 'return_date', label: 'Return Date', type: 'date', placeholder: 'Enter return date', icon: 'calendar-alt' },
            { name: 'sector', label: 'Sector', type: 'text', placeholder: 'Enter sector', icon: 'map-marker-alt' },
            { name: 'airline', label: 'Airline', type: 'text', placeholder: 'Enter airline', icon: 'plane' },
        ],
        section2: [
            { name: 'passengerCount', label: 'Passenger', type: 'custom_passenger', icon: 'users' },
        ],
        section3: [
            { name: 'receivable_amount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd' },
            { name: 'agent_name', label: 'Agent Name', type: 'select', options: agentNames, placeholder: 'Select agent name', icon: 'user-tie' },
            { name: 'paid_cash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
            { name: 'bank_title', label: 'Bank Title', type: 'select', options: BANK_OPTIONS.map(opt => opt.value), placeholder: 'Select bank title', icon: 'university' },
            { name: 'paid_in_bank', label: 'Paid In Bank', type: 'number', placeholder: 'Enter bank payment amount', icon: 'university' },
            { name: 'payable_to_vendor', label: 'Payable To Vendor', type: 'number', placeholder: 'Enter payable to vendor', icon: 'user-tie' },
            { name: 'vendor_name', label: 'Vendor Name', type: 'select', options: vendorNames, placeholder: 'Select vendor name', icon: 'store' },
            { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Calculated automatically', icon: 'chart-line', readOnly: true },
            { name: 'remaining_amount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true }
        ]
    };

    const initialValuesTemplate = {
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
        passengers: [],
        receivable_amount: '',
        paid_cash: '',
        bank_title: '',
        paid_in_bank: '',
        payable_to_vendor: '',
        vendor_name: '',
        profit: '',
        remaining_amount: '0'
    };

    const [formInitialValues, setFormInitialValues] = useState(initialValuesTemplate);

    // Validation Schema
    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Employee Name is required'),
        customer_add: Yup.string().required('Customer Address is required'),
        depart_date: Yup.date().required('Travel Date is required').typeError('Invalid date'),
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
                documentType: Yup.string().required('Document Type is required'),
                documentNo: Yup.string().required('Document Number is required'),
                // dob: Yup.date().required('Date of Birth is required').typeError('Invalid date'),
                // nationality: Yup.string().required('Nationality is required'),
                // documentExpiry: Yup.date().required('Document Expiry is required').typeError('Invalid date'),
                // issueCountry: Yup.string().required('Issue Country is required'),
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
        receivable_amount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        payable_to_vendor: Yup.number().required('Payable To Vendor is required').typeError('Payable To Vendor must be a number'),
        bank_title: Yup.string().required('Bank Title is required'),
        paid_in_bank: Yup.number().min(0, 'Paid In Bank cannot be negative').typeError('Paid In Bank must be a number'),
        profit: Yup.number(),
        remaining_amount: Yup.number(),
         reference: Yup.string(),  // no .required()
    return_date: Yup.date().nullable().notRequired().typeError('Invalid date'),
    });

    // Fetch Agent and Vendor Names (Combined Effect)
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
    }, []);

    useEffect(()=>{
        const fetchCustomers = async ()=>{
            try {
                const response = await axios.get(`${BASE_URL}/customers`);
                if(response.data.status === 'success'){
                    setCustomerNames(response.data.customers.map(c=>c.name))
                } else {
                    console.error('Failed to fetch customers',response.data.message)
                }
            } catch (error) {
                console.error('Error fetching customers', error)
            }
        };
        fetchCustomers();
    },[])

    // Initialize Form Values for Edit or New Entry
    useEffect(() => {
        if (editEntry) {
            let parsedPassengerDetails = [];
            try {
                if (editEntry.passport_detail) {
                    let details = typeof editEntry.passport_detail === 'string'
                        ? JSON.parse(editEntry.passport_detail)
                        : editEntry.passport_detail;

                    parsedPassengerDetails = Array.isArray(details) ? details : (details ? [details] : []);
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
                parsedPassengerDetails = [];
            }

            parsedPassengerDetails = parsedPassengerDetails.map(detail => ({
                ...detail,
                dob: formatDateForInput(detail.dob),
                documentExpiry: formatDateForInput(detail.documentExpiry)
            }));

            const entryString = editEntry.entry || '0/0';
            // const [current, total] = entryString.includes('/') ? entryString.split('/').map(Number) : [0, 0];
            const numbers = entryString.match(/\d+/g) || ['0', '0']; // Extract all numbers
const [current, total] = numbers.map(num => parseInt(num, 10));
            setEntryNumber(current);
            setTotalEntries(total);

            setFormInitialValues({
                ...initialValuesTemplate,
                employee_name: editEntry.employee_name || user?.username || '',
                agent_name: editEntry.agent_name || '',
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                entry: entryString,
                depart_date: editEntry? formatDateForInput(editEntry.depart_date):'',
                return_date:editEntry? formatDateForInput(editEntry.return_date) :'',
                sector: editEntry.sector || '',
                airline: editEntry.airline || '',
                adults: editEntry.adults || 0,
                children: editEntry.children || 0,
                infants: editEntry.infants || 0,
                passengers: parsedPassengerDetails,
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
                    setEntryNumber((ticketCounts?.current_count || 0) + 1);
                    setTotalEntries((ticketCounts?.global_count || 0) + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
            };
            getCounts();

            setFormInitialValues(prev => ({
                ...prev,
                employee_name: user?.username || '',
                passengers: []
            }));
        }
    }, [editEntry, user]);

    // Update entry string when counts change
    useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            entry: `Ticket ${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries]);

    // Handles form submission
    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
        setSubmitting(true);
        const passportDetail = JSON.stringify(values.passengers.map(p => ({
            title: p.title, firstName: p.firstName, lastName: p.lastName, dob: p.dob,
            nationality: p.nationality, documentType: p.documentType, documentNo: p.documentNo,
            documentExpiry: p.documentExpiry, issueCountry: p.issueCountry,
        })));

        try {
            const entryValueToSubmit = editEntry ? editEntry.entry : `Ticket ${entryNumber}/${totalEntries}`;
            const parsedEntryNumber = parseInt(entryValueToSubmit.replace('Ticket ', '').split('/')[0]);

            const requestData = {
                employee_name: values.employee_name, agent_name: values.agent_name, customer_add: values.customer_add,
                reference: values.reference || null, entry: entryValueToSubmit, depart_date: values.depart_date || null,
                return_date: values.return_date || null, sector: values.sector, airline: values.airline,
                adults: values.adults, children: values.children, infants: values.infants,
                passport_detail: passportDetail, receivable_amount: parseInt(values.receivable_amount),
                paid_cash: parseInt(values.paid_cash), bank_title: values.bank_title, paid_in_bank: parseFloat(values.paid_in_bank),
                payable_to_vendor: parseInt(values.payable_to_vendor), vendor_name: values.vendor_name,
                profit: parseInt(values.profit), remaining_amount: parseInt(values.remaining_amount)
            };

            const url = editEntry ? `${BASE_URL}/ticket/${editEntry.id}` : `${BASE_URL}/ticket`;
            const method = editEntry ? 'PUT' : 'POST';

            const ticketResponse = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData),
            });

            if (!ticketResponse.ok) throw new Error(`HTTP error! status: ${ticketResponse.status}`);

            if (!editEntry) {
                await incrementFormEntry('ticket', parsedEntryNumber);

              const commonDetail = [
    values.sector || '',
    values.depart_date || '',
    values.return_date || '',
    values.airline || '',
    `${values.passengers[0]?.firstName || ''} ${values.passengers[0]?.lastName || ''}`.trim()
].join(',');

                // Vendor data submission
                const vendorData = {
                    vender_name: values.vendor_name, detail: commonDetail,
                    credit: parseInt(values.payable_to_vendor), date: new Date().toISOString().split('T')[0],
                    entry: entryValueToSubmit, bank_title: values.bank_title, debit: null
                };
                const vendorResponse = await fetch(`${BASE_URL}/vender`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vendorData),
                });
                if (!vendorResponse.ok) console.error('Vendor submission failed:', vendorResponse.status);

                // Agent data submission
                const agentCredit = (parseInt(values.paid_cash) || 0) + (parseFloat(values.paid_in_bank) || 0);
                
                const agentData = {
                    agent_name: values.agent_name, employee: values.employee_name, detail: commonDetail,
                    receivable_amount:parseInt(values.receivable_amount) || 0,
                    paid_cash:parseInt(values.paid_cash) || 0,
                    paid_bank:parseFloat(values.paid_in_bank) || 0,

                    credit: agentCredit, date: new Date().toISOString().split('T')[0],
                    entry: entryValueToSubmit, bank_title: values.bank_title, debit: null
                };
                const agentResponse = await fetch(`${BASE_URL}/agent`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(agentData),
                });
                if (!agentResponse.ok) console.error('Agent submission failed:', agentResponse.status);

                // Submit to Office Accounts
                if (values.bank_title && (parseFloat(values.paid_in_bank) || 0) > 0) {
                    const officeAccountDetail = `Customer: ${values.passengers[0]?.firstName || ''} ${values.passengers[0]?.lastName || ''}, Ref: ${values.reference || 'N/A'}, Agent: ${values.agent_name || 'N/A'}`;

                    const officeAccountData = {
                        bank_name: values.bank_title,
                        employee_name: values.employee_name,
                        entry: entryValueToSubmit, // Use Ticket 13/56 format
                        date: new Date().toISOString().split('T')[0],
                        detail: officeAccountDetail,
                        credit: parseFloat(values.paid_in_bank) || 0,
                        debit: 0,
                    };

                    try {
                        const officeAccountResponse = await axios.post(`${BASE_URL}/accounts`, officeAccountData);
                        if (officeAccountResponse.status !== 200 && officeAccountResponse.status !== 201) {
                            console.error('Office Account submission failed with status:', officeAccountResponse.status, officeAccountResponse.data);
                        } else {
                            console.log('Office Account submitted successfully:', officeAccountResponse.data);
                        }
                    } catch (officeAccountError) {
                        console.error('Error submitting Office Account data:', officeAccountError.response ? officeAccountError.response.data : officeAccountError.message);
                    }
                }
            }

            resetForm();
            onSubmitSuccess();
        } catch (error) {
            console.error('Submission error:', error);
            setErrors({ general: 'Failed to submit form. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Reusable Field Rendering Logic
    const renderField = (field, values, setFieldValue) => (
        <motion.div key={field.name} className="mb-4" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } }}>
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
                        {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Field>
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-8 rounded-t-xl">
                <motion.h2 className="text-2xl font-bold text-black flex items-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <i className="fas fa-ticket-alt mr-3"></i>
                    {editEntry ? 'Update Ticket' : 'New Ticket Booking'}
                </motion.h2>
                <motion.p className="text-blue-600 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                    Please fill in the ticket details
                </motion.p>
            </div>

            <div className="px-8 pt-6">
                <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((step) => (
                        <button
                            key={step}
                            onClick={() => setActiveSection(step)}
                            className={`flex-1 relative ${step < activeSection ? 'text-green-500' : step === activeSection ? 'text-purple-600' : 'text-gray-400'}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${step < activeSection ? 'bg-green-100' : step === activeSection ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {step < activeSection ? (<i className="fas fa-check"></i>) : (<span className="font-medium">{step}</span>)}
                                </div>
                                <span className="text-sm font-medium">
                                    {step === 1 ? 'Ticket Info' : step === 2 ? 'Passport Details' : 'Payment Details'}
                                </span>
                            </div>
                            {step < 3 && (
                                <div className={`absolute top-5 left-full w-full h-0.5 -ml-2 ${step < activeSection ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: "calc(100% - 2rem)" }}></div>
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

                            <motion.div key={`section-${activeSection}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                {activeSection === 1 && formFields.section1.map(field => renderField(field, values, setFieldValue))}
                                {activeSection === 2 && (
                                    <>
                                        {renderField(formFields.section2[0], values, setFieldValue)}
                                        {values.passengers.map((_, index) => (
                                            <PassengerDetailsFields key={index} index={index} fieldPrefix={`passengers[${index}]`} />
                                        ))}
                                    </>
                                )}
                                {activeSection === 3 && formFields.section3.map(field => renderField(field, values, setFieldValue))}
                            </motion.div>

                            {errors.general && (
                                <motion.div className="text-red-600 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                    {errors.general}
                                </motion.div>
                            )}

                            <motion.div className="flex justify-between mt-8 pt-4 border-t border-gray-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                <div>
                                    {activeSection > 1 && (
                                        <motion.button type="button" onClick={() => setActiveSection(activeSection - 1)} className="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors flex items-center" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <i className="fas fa-arrow-left mr-2"></i> Back
                                        </motion.button>
                                    )}
                                </div>

                                <div className="flex space-x-3">
                                    <motion.button type="button" onClick={onCancel} className="px-5 py-2 border bg-gray-400 border-gray-300 rounded-lg text-black hover:bg-blue-600 transition-colors" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={isSubmitting}>
                                        Cancel
                                    </motion.button>
                                    {activeSection < 3 ? (
                                        <motion.button >
                                           
                                        </motion.button>
                                    ) : (
                                        <motion.button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center shadow-md hover:shadow-lg transition-all" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={isSubmitting}>
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