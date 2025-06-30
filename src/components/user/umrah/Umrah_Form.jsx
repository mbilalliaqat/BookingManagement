import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

// Create a component to handle automatic calculation of remaining amount

const FormikConsumer = ({ children }) => {
    const formik = useFormikContext();
    return children(formik);
};

const Umrah_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const { user } = useAppContext();
    const [activeSection, setActiveSection] = useState(1);
    const [showPassengerSlider,setShowPassengerSlider]=useState(false);
    const [entryNumber, setEntryNumber]=useState(0);
    const [totalEntries,setTotalEntries]=useState(0);

    const AutoCalculate = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        // Get values as numbers (defaulting to 0 if empty or NaN)
        const receivable = parseInt(values.receivableAmount) || 0;
        const cashPaid = parseInt(values.paidCash) || 0;
        const bankPaid = parseInt(values.paidInBank) || 0;
        const payableToVendor = parseInt(values.payableToVendor) || 0;
        
        // Calculate remaining amount
        const remaining = receivable - cashPaid - bankPaid;
        setFieldValue('remainingAmount', remaining);
        
        // Calculate profit only if payableToVendor is provided
        if (payableToVendor > 0) {
            const profit = receivable - payableToVendor;
            setFieldValue('profit', profit);
        } else {
            // Clear profit if payableToVendor is not provided
            setFieldValue('profit', '');
        }
    }, [
        values.receivableAmount,
        values.paidCash,
        values.paidInBank,
        values.payableToVendor,
        setFieldValue
    ]);
    
    return null;
};




    const [formInitialValues, setFormInitialValues] = useState({
        userName: user?.username || '',
        customerAdd: '',
        reference: '',
        entry:'0/0',
        packageDetail: '',
        depart_date: '',
        return_date:'',
        sector: '',
        airline: '',
        adults:(editEntry && editEntry.adults) || 0,
        children:(editEntry && editEntry.children) || 0,
        infants:(editEntry && editEntry.infants) || 0,
        // Replace passportDetail with structured passport information
        passengerTitle: '',
        passengerFirstName: '',
        passengerLastName: '',
        passengerDob: '',
        passengerNationality: '',
        documentType: 'Passport',
        documentNo: '',
        documentExpiry: '',
        documentIssueCountry: '',
        receivableAmount: '',
        paidCash: '',
        bank_title:'',
        paidInBank: '',
        payableToVendor: '',
        vendorName: '',
        profit: '',
        remainingAmount: '0'
    });

    const validationSchema = Yup.object({
        userName: Yup.string().required('Employee Name is required'),
        customerAdd: Yup.string().required('Customer Address is required'),
        reference: Yup.string().required('Reference is required'),
        packageDetail: Yup.string().required('Package Detail is required'),
        depart_date: Yup.date().required('Depart Date is required').typeError('Invalid date'),
        return_date: Yup.date().required('Return Date is required').typeError('Invalid date'),
        sector: Yup.string().required('Sector is required'),
        airline: Yup.string().required('Airline is required'),

        adults:Yup.number().required('Adults is required'),
        children:Yup.number().required('children is required'),
        infants:Yup.number().required('Infants is required'),

        // Validation for new passport fields
        passengerTitle: Yup.string().required('Title is required'),
        passengerFirstName: Yup.string().required('First Name is required'),
        passengerLastName: Yup.string().required('Last Name is required'),
        passengerDob: Yup.date().required('Date of Birth is required').typeError('Invalid date'),
        passengerNationality: Yup.string().required('Nationality is required'),
        documentType: Yup.string().required('Document Type is required'),
        documentNo: Yup.string().required('Document Number is required'),
        documentExpiry: Yup.date().required('Expiry Date is required').typeError('Invalid date'),
        documentIssueCountry: Yup.string().required('Issue Country is required'),
        receivableAmount: Yup.number().required('Receivable Amount is required').typeError('Receivable Amount must be a number'),
        paidCash: Yup.number().required('Paid Cash is required').typeError('Paid Cash must be a number'),
        bank_title: Yup.string().required('Bank Title is required'),
        paidInBank: Yup.string().required('Paid In Bank is required'),
        payableToVendor: Yup.number().required('Payable To Vendor is required').typeError('Payable To Vendor must be a number'),
        vendorName: Yup.string().required('Vendor Name is required'),
        profit: Yup.number(),
        remainingAmount: Yup.number()
    });

    useEffect(()=>{
        const getCounts = async ()=>{
            const counts = await fetchEntryCounts();
            if(counts){
                const umrahCounts = counts.find(c=>c.form_type === 'umrah');
                if(umrahCounts){
                    setEntryNumber(umrahCounts.current_count + 1);
                    setTotalEntries(umrahCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                } 
            } else{
                setEntryNumber(1);
                    setTotalEntries(1);
            }
        };
        getCounts();

        setFormInitialValues(prev =>({
            ...prev,
            userName :user?.username || '',
            entry:`${entryNumber}/${totalEntries}`
        }))
    },[editEntry,user]);

     useEffect(() => {
        setFormInitialValues(prev => ({
            ...prev,
            entry: `${entryNumber}/${totalEntries}` // Update entry value on state change
        }));
    }, [entryNumber, totalEntries]);

    useEffect(() => {
        if (editEntry) {
            // Parse passport details if it's stored as a JSON string
            let parsedPassportDetails = {};
            try {
                if (typeof editEntry.passportDetail === 'string') {
                    parsedPassportDetails = JSON.parse(editEntry.passportDetail);
                } else if (typeof editEntry.passportDetail === 'object' && editEntry.passportDetail !== null) {
                    parsedPassportDetails = editEntry.passportDetail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
                // In case of error, leave it as an empty object
            }

            // Format dates properly for the form fields
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
            };

            const newValues = {
                userName: editEntry.userName || user?.username || '',
                customerAdd: editEntry.customerAdd || '',
                reference: editEntry.reference || '',
                entry: editEntry.entry || '0/0',
                packageDetail: editEntry.packageDetail || '',
                depart_date: formatDate(editEntry.depart_date),
                return_date: formatDate(editEntry.return_date),
                sector: editEntry.sector || '',
                airline: editEntry.airline || '',

                adults:editEntry.adults || 0,
                children:editEntry.children || 0,
                infants:editEntry.infants || 0,
                
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
                
                receivableAmount: editEntry.receivableAmount || '',
                paidCash: editEntry.paidCash || '',
                bank_title:editEntry.bank_title || '',
                paidInBank: editEntry.paidInBank || '',
                payableToVendor: editEntry.payableToVendor || '',
                vendorName: editEntry.vendorName || '',
                profit: editEntry.profit || '',
                remainingAmount: editEntry.remainingAmount || ''
            };
            
            setFormInitialValues(newValues);
            console.log("Loaded edit values:", newValues);
        }
    }, [editEntry, user]);

    const handlePassengerChange=(type,delta,currentValues,setFieldValue)=>{
        setFieldValue(type,Math.max(0,(currentValues[type] ||0)+delta)) ;
    }

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
            userName: values.userName,
            customerAdd: values.customerAdd,
            reference: values.reference,
             entry: values.entry,
            packageDetail: values.packageDetail || null,
            depart_date: new Date(values.depart_date),
            return_date: new Date(values.return_date),
            sector: values.sector,
            airline: values.airline,
            adults: values.adults,
            children: values.children,
            infants: values.infants,
            passportDetail: passportDetail, // Send as JSON string
            receivableAmount: parseInt(values.receivableAmount),
            paidCash: parseInt(values.paidCash),
            bank_title: values.bank_title,
            paidInBank: values.paidInBank,
            payableToVendor: parseInt(values.payableToVendor),
            vendorName: values.vendorName,
            profit: parseInt(values.profit),
            remainingAmount: parseInt(values.remainingAmount)
        };

        try {
            const url = editEntry ? `${BASE_URL}/umrah/${editEntry.id}` : `${BASE_URL}/umrah`;
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

            if(!editEntry){
                const vendorData={
                    user_name:values.vendorName,
                     amount: parseInt(values.payableToVendor),
                   date: new Date(),
                }
                   const vendorResponse = await fetch(`${BASE_URL}/vender`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(vendorData),
                });

                if (!vendorResponse.ok) {
                    console.error('Vendor submission failed:', vendorResponse.status);
                    // Log the error but don't block the form submission
                    setErrors({ general: 'Umrah booking saved, but failed to save vendor details. Please try again later.' });
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
        { name: 'entry', label: 'Entry', type: 'text', placeholder: '', icon: 'hashtag', readOnly: true }, // New entry field
        { name: 'customerAdd', label: 'Customer Address', type: 'text', placeholder: 'Enter customer address', icon: 'address-card' },
        { name: 'reference', label: 'Reference', type: 'text', placeholder: 'Enter reference', icon: 'tag' },
        { name: 'packageDetail', label: 'Package Detail', type: 'text', placeholder: 'Enter package detail', icon: 'suitcase' },
        { name: 'depart_date', label: 'Depart Date', type: 'date', placeholder: 'Enter Depart date', icon: 'calendar-alt' },
        { name: 'return_date', label: 'Return Date', type: 'date', placeholder: 'Enter Return date', icon: 'calendar-alt' },
        { name: 'sector', label: 'Sector', type: 'text', placeholder: 'Enter sector', icon: 'map-marker-alt' },
        { name: 'airline', label: 'Airline', type: 'text', placeholder: 'Enter airline', icon: 'plane' },
    ];

    // Updated section2 with new passport fields
    const section2Fields = [
        
        {
            name: 'passengerCount',
            label: 'Passenger',
            type: 'custom_passenger', // Custom type for the passenger slider
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
        { name: 'receivableAmount', label: 'Total Receivable Amount', type: 'number', placeholder: 'Enter total receivable amount', icon: 'hand-holding-usd' },
        { name: 'paidCash', label: 'Paid Cash', type: 'number', placeholder: 'Enter paid cash', icon: 'money-bill-wave' },
        { name: 'bank_title', label: 'Bank Title', type: 'text', placeholder: 'Enter Bank title', icon: 'store' },
        { name: 'paidInBank', label: 'Paid In Bank', type: 'text', placeholder: 'Enter bank payment details', icon: 'university' },
        { name: 'payableToVendor', label: 'Payable To Vendor', type: 'number', placeholder: 'Enter payable to vendor', icon: 'user-tie' },
        { name: 'vendorName', label: 'Vendor Name', type: 'text', placeholder: 'Enter vendor name', icon: 'store' },
        { name: 'profit', label: 'Profit', type: 'number', placeholder: 'Enter profit', icon: 'chart-line', readOnly: true},
        { name: 'remainingAmount', label: 'Remaining Amount', type: 'number', placeholder: 'Calculated automatically', icon: 'balance-scale', readOnly: true }
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
                        className="w-full border border-gray-300 rounded-md px-3 py-1"
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
                ) :field.type === 'custom_passenger' ? (
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
                ): (
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

                    {/* Passenger Slider */}
                 {field.name === 'passengerCount' && showPassengerSlider && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg p-4 mt-1 w-64 right-0"
                    >
                        {/* Access formik context directly here to update values */}
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-8 rounded-t-xl">
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
                    enableReinitialize={true} // This ensures the form updates when initialValues change
                >
                    {({ isSubmitting, errors }) => (
                        <Form>
                            {/* Add the auto-calculate component */}
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

export default Umrah_Form;