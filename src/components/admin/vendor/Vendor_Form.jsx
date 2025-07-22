import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import ButtonSpinner from '../../ui/ButtonSpinner';
import VenderNameModal from '../../ui/VenderNameModal'; 
import { fetchEntryCounts } from '../../ui/api';

const Vendor_Form = ({ onCancel, onSubmitSuccess, editingEntry }) => {
    const [vendorNames, setVendorNames] = useState([]);
    const [isLoadingNames, setIsLoadingNames] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0); 
    const [totalEntries, setTotalEntries] = useState(0);
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const isEditing = !!editingEntry;
   const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};
    const initialValues = {
        vender_name: editingEntry?.vender_name || '', 
        date: formatDate(editingEntry?.date),
        entry: editingEntry?.entry || `${entryNumber}/${totalEntries}`,
        detail: editingEntry?.detail || '', 
        bank_title: editingEntry?.bank_title || '',
        credit: editingEntry?.credit ? editingEntry.credit.toString() : '',
        debit: editingEntry?.debit ? editingEntry.debit.toString() : '',
    };

    const validationSchema = Yup.object({
        vender_name: Yup.string().required('Vendor name is required'),
        date: Yup.date().required('Date is required'),
        entry: Yup.string().required('Entry is required'),
        detail: Yup.string().required('Detail is required'),
        bank_title: Yup.string().required('Bank Title is required'),
        // credit: Yup.number().transform((value, originalValue) => originalValue === '' ? undefined : value).min(0, 'Credit must be positive').nullable(),
        debit: Yup.number().transform((value, originalValue) => originalValue === '' ? undefined : value).min(0, 'Debit must be positive').nullable(),
    }).test('credit-debit-test', 'Either Credit or Debit is required, but not both', (values) => {
        const hasCredit = parseFloat(values.credit) > 0;
        const hasDebit = parseFloat(values.debit) > 0;
        return (hasCredit && !hasDebit) || (!hasCredit && hasDebit);
    });

    const fetchVendorNames = async () => {
        try {
            setIsLoadingNames(true);
            const response = await axios.get(`${BASE_URL}/vender-names/existing`);
            if (response.data.status === 'success') {
                setVendorNames(response.data.vendorNames || []);
            }
        } catch (error) {
            console.error('Error fetching vendor names:', error);
        } finally {
            setIsLoadingNames(false);
        }
    };

    useEffect(() => {
        fetchVendorNames();
    }, []);

     useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const vendorCounts = counts.find(c => c.form_type === 'vender');
                if (vendorCounts) {
                    setEntryNumber(vendorCounts.current_count+1); 
                    setTotalEntries(vendorCounts.global_count +1);
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

     useEffect(() => {
        if (!isEditing) {
            setVendorNames(prev => [...prev]); 
        }
    }, [entryNumber, totalEntries, isEditing]);

    const handleVendorAdded = async (newVendorName) => {
        if (newVendorName && !vendorNames.includes(newVendorName)) {
            setVendorNames(prev => [...prev, newVendorName].sort());
        }
        return Promise.resolve(); 
    };

    const onSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setIsSubmitting(true);
            setSubmitting(true); 

            const submitData = {
                vender_name: values.vender_name,
                date: values.date,
                entry: values.entry, 
                detail: values.detail, 
                bank_title: values.bank_title,
                credit: parseFloat(values.credit) || null, 
                debit: parseFloat(values.debit) || null, 
            };

            let response;
            if (isEditing) {
                response = await axios.put(`${BASE_URL}/vender/${editingEntry.id}`, submitData);
            } else {
                response = await axios.post(`${BASE_URL}/vender`, submitData);
            }

            if (response.data.status === 'success') {
                console.log(`Vendor entry ${isEditing ? 'updated' : 'created'} successfully:`, response.data);
                resetForm();
                onSubmitSuccess(); 
            } else {
                
                alert(`Failed to ${isEditing ? 'update' : 'save'} vendor entry: ${response.data.message}`);
            }
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'submitting'} form:`, error);
            alert(`Failed to ${isEditing ? 'update' : 'save'} vendor entry: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
            setSubmitting(false); 
        }
    };

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-2xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    {isEditing ? 'UPDATE VENDOR ENTRY' : 'VENDOR FORM'}
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={onSubmit}
                    enableReinitialize={true} // Important for updating form when editingEntry changes
                >
                    {formik => (
                        <Form className="flex-1 overflow-hidden p-6">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Vendor Name with Dropdown and Add Button */}
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Vendor Name</label>
                                    <div className="flex items-center gap-2">
                                        <Field name="vender_name">
                                            {({ field }) => (
                                                <select
                                                    {...field}
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                    disabled={isLoadingNames || isSubmitting}
                                                >
                                                    <option value="">
                                                        {isLoadingNames ? 'Loading...' : 'Select Vendor Name'}
                                                    </option>
                                                    {vendorNames.map((name, index) => (
                                                        <option key={index} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </Field>
                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                                                title="Add New Vendor Name"
                                                disabled={isSubmitting}
                                            >
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        )}
                                    </div>
                                    <ErrorMessage name="vender_name" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Date</label>
                                    <Field
                                        type="date"
                                        name="date"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={isSubmitting}
                                    />
                                    <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                               
                                 <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <Field
                                type="text"
                                name="entry"
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                                disabled
                                readOnly
                                                            />
                            <ErrorMessage name="entry" component="div" className="text-red-500 text-sm mt-1" />
                        </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Detail</label>
                                    <Field
                                        type="text"
                                        name="detail"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={isSubmitting}
                                    />
                                    <ErrorMessage name="detail" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Bank Title</label>
                                    <Field
                                        type="text"
                                        name="bank_title"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={isSubmitting}
                                    />
                                    <ErrorMessage name="bank_title" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {/* <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Payable</label>
                                    <Field
                                        type="number"
                                        name="credit"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={isSubmitting}
                                    />
                                    <ErrorMessage name="credit" component="div" className="text-red-500 text-sm mt-1" />
                                </div> */}

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Payed</label>
                                    <Field
                                        type="number"
                                        name="debit"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled={isSubmitting}
                                    />
                                    <ErrorMessage name="debit" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {/* Removed 'Amount', 'Withdraw', and 'Attachment' fields as they are not directly handled by the provided vender.ts */}
                                {/* If 'Amount' and 'Withdraw' need to be re-added, their logic concerning 'credit' and 'debit' needs clarification. */}
                                {/* For 'Attachment', you'd need a separate file upload mechanism and backend endpoint if files are to be stored. */}
                            </div>

                            <div className="mt-10 flex justify-center">
                                <button
                                    type="submit"
                                    className="w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                                    disabled={isSubmitting || formik.isSubmitting}
                                >
                                    {(isSubmitting || formik.isSubmitting) && <ButtonSpinner />}
                                    {isEditing ? 'Update' : 'Submit'}
                                </button>
                                <button
                                    type="button"
                                    className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                                    onClick={onCancel}
                                    disabled={isSubmitting || formik.isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>

                {/* Vendor Name Modal - Only show when not editing */}
                {!isEditing && (
                    <VenderNameModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onVenderAdded={handleVendorAdded} // Fixed: Changed from onVendorAdded to onVenderAdded to match the modal's expected prop
                    />
                )}
            </div>
        </div>
    );
};

export default Vendor_Form;