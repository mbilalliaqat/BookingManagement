import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';

const AgentForm = ({ onCancel }) => {
    const { user } = useAppContext();
    const initialValues = {
        agent_name: '',
        date: '',
        employee: user?.username || '', 
        detail: '',
        credit: '',
        debit: '',
    };

    const validationSchema = Yup.object({
        agent_name: Yup.string().required('Agent name is required'),
        date: Yup.date().required('Date is required'),
        employee: Yup.string().required('Employee is required'),
        detail: Yup.string().required('Detail is required'),
        credit: Yup.number().min(0, 'Credit must be positive'),
        debit: Yup.number().min(0, 'Debit must be positive'),
    }).test('credit-debit-test', 'Either Credit or Debit is required', (values) => {
        return values.credit || values.debit;
    });

    const onSubmit = async (values, { setSubmitting,resetForm}) => {
        try {
            const response = await axios.post('http://localhost:8787/agent', values);
            resetForm();
            onCancel();
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-2xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    AGENT FORM
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
                    {formik => (
                        <Form className="flex-1 overflow-hidden p-6">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Agent Name</label>
                                    <Field
                                        type="text"
                                        name="agent_name"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="agent_name" component="div" className="text-red-500" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Date</label>
                                    <Field
                                        type="date"
                                        name="date"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="date" component="div" className="text-red-500" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Employee</label>
                                    <Field
                                        type="text"
                                        name="employee"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        disabled // Make the field read-only
                                    />
                                    <ErrorMessage name="employee" component="div" className="text-red-500" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Detail</label>
                                    <Field
                                        type="text"
                                        name="detail"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="detail" component="div" className="text-red-500" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Credit</label>
                                    <Field
                                        type="number"
                                        name="credit"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="credit" component="div" className="text-red-500" />
                                </div>

                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Debit</label>
                                    <Field
                                        type="number"
                                        name="debit"
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    <ErrorMessage name="debit" component="div" className="text-red-500" />
                                </div>
                            </div>

                            <div className="mt-10 flex justify-center">
                                <button
                                    type="submit"
                                    className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                                >
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                                    onClick={onCancel}
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

export default AgentForm;