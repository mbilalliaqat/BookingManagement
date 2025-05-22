import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';

const GamcaToken_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();

    const initialValues = {
        employee_name: user?.username || '',
        entry: '',
        customer_add: '',
        reference: '',
        country: '',
        passport_detail: '',
        receivable_amount: '',
        paid_cash: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: ''
    };

    useEffect(() => {
        if (editEntry) {
            initialValues.employee_name = editEntry.employee_name || user?.username || '';
            initialValues.entry = editEntry.entry || '';
            initialValues.customer_add = editEntry.customer_add || '';
            initialValues.reference = editEntry.reference || '';
            initialValues.country = editEntry.country || '';
            initialValues.passport_detail = editEntry.passport_detail || '';
            initialValues.receivable_amount = editEntry.receivable_amount || '';
            initialValues.paid_cash = editEntry.paid_cash || '';
            initialValues.paid_in_bank = editEntry.paid_in_bank || '';
            initialValues.profit = editEntry.profit || '';
            initialValues.remaining_amount = editEntry.remaining_amount || '';
        }
    }, [editEntry, user]);

    const validationSchema = Yup.object({
        employee_name: Yup.string().required('Enter Your User Name'),
        entry: Yup.number().required('Enter Your Entry').typeError('Entry must be a number'),
        customer_add: Yup.string().required('Enter Your Customer Add'),
        reference: Yup.string().required('Enter Your Reference'),
        country: Yup.string().required('Enter Your Country'),
        passport_detail: Yup.string().required('Enter Your Passport Detail'),
        receivable_amount: Yup.number().required('Enter Your Receivable Amount').typeError('Receivable Amount must be a number'),
        paid_cash: Yup.number().required('Enter Your Paid Cash').typeError('Paid Cash must be a number'),
        paid_in_bank: Yup.string().required('Enter Your Paid In Bank'),
        profit: Yup.number().required('Enter Your Profit').typeError('Profit must be a number'),
        remaining_amount: Yup.number().required('Enter Your Remaining Amount').typeError('Remaining Amount must be a number')
    });

    const handleSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
    const requestData = {
        employee_name:values.employee_name,
        entry:parseInt(values.entry),
        customer_add:values.customer_add,
        reference:values.reference,
        country:values.country,
        passport_detail:values.passport_detail,
        receivable_amount: parseInt(values.receivable_amount),
        paid_cash: parseInt(values.paid_cash),
        paid_in_bank: values.paid_in_bank,
        profit: parseInt(values.profit),
        remaining_amount: parseInt(values.remaining_amount)
    };

    try {
        const url = editEntry? `${BASE_URL}/gamca-token/${editEntry.id}`: `${BASE_URL}/gamca-token`;
        const method = editEntry ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`); // Line ~85
        }

        await response.json();
        resetForm({
            values: {
                employee_name: user?.username || '',
                entry: '',
                customer_add: '',
                reference: '',
                country: '',
                passport_detail: '',
                receivable_amount: '',
                paid_cash: '',
                paid_in_bank: '',
                profit: '',
                remaining_amount: ''
            }
        });

        if (onSubmitSuccess) {
            onSubmitSuccess();
        } else {
            onCancel();
        }
    } catch (error) {
        console.error('Error:', error);
        setErrors({ general: 'Failed to submit form. Please try again later.' });
        setSubmitting(false);
    }
};

    return (
        <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
            <div className="h-[70vh] w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    GAMCA TOKEN
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, errors }) => (
                        <Form className="flex-1 overflow-y-auto p-6">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Employee Name</label>
                                    <Field
                                        type="text"
                                        name="employee_name"
                                        placeholder="Enter User Name"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        readOnly
                                    />
                                    <ErrorMessage name="employee_name" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Entry</label>
                                    <Field
                                        type="number"
                                        name="entry"
                                        placeholder="Enter Entry"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="entry" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Customer Add</label>
                                    <Field
                                        type="text"
                                        name="customer_add"
                                        placeholder="Enter Customer Add"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="customer_add" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Reference</label>
                                    <Field
                                        type="text"
                                        name="reference"
                                        placeholder="Enter Reference"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="reference" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Country</label>
                                    <Field
                                        type="text"
                                        name="country"
                                        placeholder="Enter Country"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="country" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Passport Detail</label>
                                    <Field
                                        type="text"
                                        name="passport_detail"
                                        placeholder="Enter Passport Detail"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="passport_detail" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Receivable Amount</label>
                                    <Field
                                        type="number"
                                        name="receivable_amount"
                                        placeholder="Enter Receivable Amount"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="receivable_amount" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Paid Cash</label>
                                    <Field
                                        type="number"
                                        name="paid_cash"
                                        placeholder="Enter Paid Cash"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="paid_cash" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Paid In Bank</label>
                                    <Field
                                        type="text"
                                        name="paid_in_bank"
                                        placeholder="Enter Paid In Bank"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="paid_in_bank" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Profit</label>
                                    <Field
                                        type="number"
                                        name="profit"
                                        placeholder="Enter Profit"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="profit" component="span" className="text-red-500" />
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Remaining Amount</label>
                                    <Field
                                        type="number"
                                        name="remaining_amount"
                                        placeholder="Enter Remaining Amount"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="remaining_amount" component="span" className="text-red-500" />
                                </div>
                            </div>
                            {errors.general && <div className="text-red-500 mt-4">{errors.general}</div>}
                            <div className="mt-10 flex justify-center">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-70 bg-gray-300 text-black font-medium py-3 px-8 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                                >
                                    {isSubmitting && <ButtonSpinner />}
                                    {editEntry ? 'Update' : 'Submit'}
                                </button>
                                <button
                                    type="button"
                                    className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 px-8 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                >
                                    Cancel
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