import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';

const VisaProcessing_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const {user}=useAppContext();

  const [data, setData] = useState({
      employee_name: '',
      entry: '',
      file_number: '',
      reference: '',
      sponsor_name: '',
      visa_number: '',
      id_number: '',
      embassy: '',
      passport_detail: '',
      e_number: '',
      customer_add: '',
      ptn_permission: '',
      embassy_send_date: '',
      embassy_return_date: '',
      protector_date: '',
      passport_deliver_date: '',
      receivable_amount: '',
      additional_charges: '',
      pay_for_protector: '',
      paid_cash: '',
      paid_in_bank: '',
      profit: '',
      remaining_amount: ''
  });

   useEffect(() => {
         if(user&& user.username){
          setData(prevData=>({
              ...prevData,
              employee_name:user.username
          }))
         } 
      },[user])

  const [prevError, setPrevError] = useState({
      employee_name: '',
      entry: '',
      file_number: '',
      reference: '',
      sponsor_name: '',
      visa_number: '',
      id_number: '',
      embassy: '',
      passport_detail: '',
      e_number: '',
      customer_add: '',
      ptn_permission: '',
      embassy_send_date: '',
      embassy_return_date: '',
      protector_date: '',
      passport_deliver_date: '',
      receivable_amount: '',
      additional_charges: '',
      pay_for_protector: '',
      paid_cash: '',
      paid_in_bank: '',
      profit: '',
      remaining_amount: ''
  });

  // Pre-populate form if editing
  useEffect(() => {
      if (editEntry) {
          setData({
              employee_name: editEntry.employee_name || '',
              entry: editEntry.entry || '',
              file_number: editEntry.file_number || '',
              reference: editEntry.reference || '',
              sponsor_name: editEntry.sponsor_name || '',
              visa_number: editEntry.visa_number || '',
              id_number: editEntry.id_number || '',
              embassy: editEntry.embassy || '',
              passport_detail: editEntry.passport_detail || '',
              e_number: editEntry.e_number || '',
              customer_add: editEntry.customer_add || '',
              ptn_permission: editEntry.ptn_permission || '',
              embassy_send_date: editEntry.embassy_send_date ? new Date(editEntry.embassy_send_date).toISOString().split('T')[0] : '',
              embassy_return_date: editEntry.embassy_return_date ? new Date(editEntry.embassy_return_date).toISOString().split('T')[0] : '',
              protector_date: editEntry.protector_date ? new Date(editEntry.protector_date).toISOString().split('T')[0] : '',
              passport_deliver_date: editEntry.passport_deliver_date ? new Date(editEntry.passport_deliver_date).toISOString().split('T')[0] : '',
              receivable_amount: editEntry.receivable_amount || '',
              additional_charges: editEntry.additional_charges || '',
              pay_for_protector: editEntry.pay_for_protector || '',
              paid_cash: editEntry.paid_cash || '',
              paid_in_bank: editEntry.paid_in_bank || '',
              profit: editEntry.profit || '',
              remaining_amount: editEntry.remaining_amount || ''
          });
      }
  }, [editEntry]);

  const handleChange = (e) => {
      setData({ ...data, [e.target.name]: e.target.value });
      setPrevError({ ...prevError, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      console.log(data);

      // Validation logic here...
      // (Keep your existing validation logic)

      const requestData = {
          employee_name: data.employee_name,
          entry: parseInt(data.entry),
          file_number: data.file_number,
          reference: data.reference,
          sponsor_name: data.sponsor_name,
          visa_number: data.visa_number,
          id_number: data.id_number,
          embassy: data.embassy,
          passport_detail: data.passport_detail,
          e_number: data.e_number,
          customer_add: data.customer_add,
          ptn_permission: data.ptn_permission,
          embassy_send_date: new Date(data.embassy_send_date),
          embassy_return_date: new Date(data.embassy_return_date),
          protector_date: new Date(data.protector_date),
          passport_deliver_date: new Date(data.passport_deliver_date),
          receivable_amount: parseInt(data.receivable_amount),
          additional_charges: parseInt(data.additional_charges),
          pay_for_protector: parseInt(data.pay_for_protector),
          paid_cash: parseInt(data.paid_cash),
          paid_in_bank:(data.paid_in_bank),
          profit: parseInt(data.profit),
          remaining_amount: parseInt(data.remaining_amount)
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

          const result = await response.json();
          console.log('Success:', result);

          // Reset form data
          setData({
              employee_name: user?.username||'',
              entry: '',
              file_number: '',
              reference: '',
              sponsor_name: '',
              visa_number: '',
              id_number: '',
              embassy: '',
              passport_detail: '',
              e_number: '',
              customer_add: '',
              ptn_permission: '',
              embassy_send_date: '',
              embassy_return_date: '',
              protector_date: '',
              passport_deliver_date: '',
              receivable_amount: '',
              additional_charges: '',
              pay_for_protector: '',
              paid_cash: '',
              paid_in_bank: '',
              profit: '',
              remaining_amount: ''
          });

          if (onSubmitSuccess) {
              onSubmitSuccess();
          } else {
              onCancel();
          }
      } catch (error) {
          console.error('Error:', error);
          setPrevError({ ...prevError, general: 'Failed to submit form. Please try again later.' });
      } finally {
          setIsSubmitting(false);
      }
  };
  return (
    <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
      <div className="h-[70vh] w-full max-w-3xl  p-8 rounded-md ">
        <div className="text-2xl font-semibold mb-6 relative inline-block">
          Visa Processing
          <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
        </div>
        <form action="#" onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6'>
            
          <div className="flex flex-wrap justify-between gap-4">
          <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Employee Name</label>
                <input  type="text"   placeholder='Enter User Name' value={data.employee_name}
                name='employee_name' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                readOnly
                />
                {prevError.employee_name && <span className="text-red-500">{prevError.employee_name}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Entry</label>
                <input  type="number"   placeholder='Enter Entry' value={data.entry}
                name='entry' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">File No.</label>
                <input  type="text"   placeholder='Enter File No.' value={data.file_number}
                name='file_number' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.file_number && <span className='text-red-500'>{prevError.file_number}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Reference</label>
                <input  type="text"   placeholder='Enter Reference' value={data.reference}
                name='reference' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.reference && <span className='text-red-500'>{prevError.reference}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Sponsor Name</label>
                <input  type="text"   placeholder='Enter Sponsor Name' value={data.sponsor_name}
                name='sponsor_name' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.sponsor_name && <span className='text-red-500'>{prevError.sponsor_name}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Visa No.</label>
                <input  type="text"   placeholder='Enter Visa No.' value={data.visa_number}
                name='visa_number' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.visa_number && <span className='text-red-500'>{prevError.visa_number}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">ID No.</label>
                <input  type="text"   placeholder='Enter ID No.' value={data.id_number}
                name='id_number' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.id_number && <span className='text-red-500'>{prevError.id_number}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Embassy</label>
                <input  type="text"   placeholder='Enter Embassy' value={data.embassy}
                name='embassy' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />{prevError.embassy && <span className='text-red-500'>{prevError.embassy}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Passport Detail</label>
                <input  type="text"   placeholder='Enter Passport Detail' value={data.passport_detail}
                name='passport_detail' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.passport_detail && <span className='text-red-500'>{prevError.passport_detail}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">E-Number </label>
                <input  type="number"   placeholder='Enter E-Number' value={data.e_number}
                    name='e_number' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.e_number && <span className='text-red-500'>{prevError.e_number}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Customer Add</label>
                <input  type="text"   placeholder='Enter Customer Add' value={data.customer_add}
                    name='customer_add' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.customer_add && <span className='text-red-500'>{prevError.customer_add}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Ptn/Permission</label>
                <input  type="text"   placeholder='Enter Ptn/Permission' value={data.ptn_permission}
                    name='ptn_permission' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.ptn_permission && <span className='text-red-500'>{prevError.ptn_permission}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Embassy Send Data</label>
                <input  type="date"   placeholder='Enter Embassy Send Date' value={data.embassy_send_date}
                    name='embassy_send_date' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.embassy_send_date && <span className='text-red-500'>{prevError.embassy_send_date}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Embassy return Date</label>
                <input  type="date"   placeholder='Enter Embassy Return Date' value={data.embassy_return_date}
                    name='embassy_return_date' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.embassy_return_date && <span className='text-red-500'>{prevError.embassy_return_date}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Protector Date</label>
                <input  type="date"   placeholder='Enter Protector Date' value={data.protector_date}
                    name='protector_date' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.protector_date && <span className='text-red-500'>{prevError.protector_date}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Passport Deliver Date</label>
                <input  type="date"   placeholder='Enter Passport Deliver Date' value={data.passport_deliver_date}
                    name='passport_deliver_date' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.passport_deliver_date && <span className='text-red-500'>{prevError.passport_deliver_date}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Receivable Amount</label>
                <input  type="number"   placeholder='Enter Receivable Amount' value={data.receivable_amount}
                    name='receivable_amount' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.receivable_amount && <span className='text-red-500'>{prevError.receivable_amount}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Additional Charges</label>
                <input  type="number"   placeholder='Enter Additional Charges' value={data.additional_charges}
                    name='additional_charges' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.additional_charges && <span className='text-red-500'>{prevError.additional_charges}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Pay For Protector</label>
                <input  type="number"   placeholder='Enter Pay For Protector' value={data.pay_for_protector}
                    name='pay_for_protector' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.pay_for_protector && <span className='text-red-500'>{prevError.pay_for_protector}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Paid Cash</label>
                <input  type="number"   placeholder='Enter Paid Cash' value={data.paid_cash}
                    name='paid_cash' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.paid_cash && <span className='text-red-500'>{prevError.paid_cash}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Paid In Bank</label>
                <input  type="text"   placeholder='Enter Paid In Bank' value={data.paid_in_bank}
                    name='paid_in_bank' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.paid_in_bank && <span className='text-red-500'>{prevError.paid_in_bank}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Profit</label>
                <input  type="number"   placeholder='Enter Profit' value={data.profit}
                    name='profit' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.profit && <span className='text-red-500'>{prevError.profit}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Remaining Amount</label>
                <input  type="number"   placeholder='Enter Remaining Amount' value={data.remaining_amount}
                    name='remaining_amount' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.remaining_amount && <span className='text-red-500'>{prevError.remaining_amount}</span>}
              </div>
              
          </div>

        

          {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                        >
                            {isSubmitting && <ButtonSpinner />}
                            {editEntry ? 'Update' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
        </form>
      </div>
    </div>
  );
};

export default VisaProcessing_Form;