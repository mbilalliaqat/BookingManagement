import React, { useState } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Tickets_Form = ({onCancel,onSubmitSuccess }) => {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data,setData]=useState({
      employee_name: '',
      entry: '',
      customer_add: '',
      reference: '',
      travel_date: '',
      sector: '',
      airline: '',
      passport_detail: '',
      receivable_amount: '',
      paid_cash: '',
      paid_in_bank: '',
      payable_to_vendor: '',
      vendor_name: '',
      profit: '',
      remaining_amount: ''
      
    })

    const [prevError,setPrevError]=useState({
      employee_name: '',
      entry: '',
      customer_add: '',
      reference: '',
      travel_date: '',
      sector: '',
      airline: '',
      passport_detail: '',
      receivable_amount: '',
      paid_cash: '',
      paid_in_bank: '',
      payable_to_vendor: '',
      vendor_name: '',
      profit: '',
      remaining_amount: ''
    })

    const handleChange=(e)=>{
        // console.log(e.target.name);
        // console.log(e.target.value);
        setData({...data,[e.target.name]:e.target.value});
        setPrevError({...prevError,[e.target.name]:""})
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log(data);
      setIsSubmitting(true);

      if (data.employee_name === "") {
          setPrevError((prevError) => ({ ...prevError, employee_name: 'Enter Your Employee Name' }));
          setIsSubmitting(false);
          return;
      } else if (data.entry === "") {
          setPrevError({ ...prevError, entry: 'Enter Your Entry' });
          setIsSubmitting(false);
          return;
      } else if (data.customer_add === "") {
          setPrevError({ ...prevError, customer_add: 'Enter Your Customer Add' });
          setIsSubmitting(false);
          return;
      } else if (data.reference === "") {
          setPrevError({ ...prevError, reference: 'Enter Your Reference' });
          setIsSubmitting(false);
          return;
      } else if (data.travel_date === "") {
          setPrevError({ ...prevError, travel_date: 'Enter Your Travel Date' });
          setIsSubmitting(false);
          return;
      } else if (data.sector === "") {
          setPrevError({ ...prevError, sector: 'Enter Your Sector' });
          setIsSubmitting(false);
          return;
      } else if (data.airline === "") {
          setPrevError({ ...prevError, airline: 'Enter Your Airline' });
          setIsSubmitting(false);
          return;
      } else if (data.passport_detail === "") {
          setPrevError({ ...prevError, passport_detail: 'Enter Your Passport Detail' });
          setIsSubmitting(false);
          return;
      } else if (data.receivable_amount === "") {
          setPrevError({ ...prevError, receivable_amount: 'Enter Your Receivable Amount' });
          setIsSubmitting(false);
          return;
      } else if (data.paid_cash === "") {
          setPrevError({ ...prevError, paid_cash: 'Enter Your Paid Cash' });
          setIsSubmitting(false);
          return;
      } else if (data.paid_in_bank === "") {
          setPrevError({ ...prevError, paid_in_bank: 'Enter Your Paid In Bank' });
          setIsSubmitting(false);
          return;
      } else if (data.payable_to_vendor === "") {
          setPrevError({ ...prevError, payable_to_vendor: 'Enter Your Payable To Vendor' });
          setIsSubmitting(false);
          return;
      } else if (data.vendor_name === "") {
          setPrevError({ ...prevError, vendor_name: 'Enter Your Vendor Name' });
          setIsSubmitting(false);
          return;
      } else if (data.profit === "") {
          setPrevError({ ...prevError, profit: 'Enter Your Profit' });
          setIsSubmitting(false);
          return;
      } else if (data.remaining_amount === "") {
          setPrevError({ ...prevError, remaining_amount: 'Enter Your Remaining Amount' });
          setIsSubmitting(false);
          return;
      } 
      else {
        const requestData = {
        
            employee_name: data.employee_name, // was userName
            entry: parseInt(data.entry),
            customer_add: data.customer_add, // was customerAdd
            reference: data.reference,
            travel_date:data.travel_date, 
            sector:data.sector,
            airline: data.airline,
            passport_detail: data.passport_detail, // was passportDetail
            receivable_amount: parseInt(data.receivable_amount), // was receivableAmount
            paid_cash: parseInt(data.paid_cash), // was paidCash
            paid_in_bank: data.paid_in_bank,
            payable_to_vendor: parseInt(data.payable_to_vendor),
            vendor_name: data.vendor_name,
            profit: parseInt(data.profit),
            remaining_amount: parseInt(data.remaining_amount)
          
          
            
        };

        console.log('Request Data:', requestData);

        try {
            const response = await fetch('http://localhost:8787/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();
            console.log('Response:', result);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Success:', result);

            // Reset form data
            setData({
              employee_name: '',
              entry: '',
              customer_add: '',
              reference: '',
              travel_date: '',
              sector: '',
              airline: '',
              passport_detail: '',
              receivable_amount: '',
              paid_cash: '',
              paid_in_bank: '',
              payable_to_vendor: '',
              vendor_name: '',
              profit: '',
              remaining_amount: ''
                
            });


            if(onSubmitSuccess ){
              onSubmitSuccess ();
            }
          else{
            onCancel();
          }
            
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }
  };
  return (
    <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
      <div className="h-[70vh] w-full max-w-3xl  p-8 rounded-md ">
        <div className="text-2xl font-semibold mb-6 relative inline-block">
          TICKETS
          <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
        </div>
        <form action="#" onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6'>
            
          <div className="flex flex-wrap justify-between gap-4">
          <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Employee Name</label>
                            <input type="text" placeholder='Enter User Name' value={data.employee_name}
                                name='employee_name' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.employee_name && <span className="text-red-500">{prevError.employee_name}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input type="number" placeholder='Enter Entry' value={data.entry}
                                name='entry' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Customer Add</label>
                            <input type="text" placeholder='Enter Customer Add' value={data.customer_add}
                                name='customer_add' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.customer_add && <span className='text-red-500'>{prevError.customer_add}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Reference</label>
                            <input type="text" placeholder='Enter Reference' value={data.reference}
                                name='reference' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.reference && <span className='text-red-500'>{prevError.reference}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Travel Date</label>
                            <input type="date" placeholder='Enter Travel Date' value={data.travel_date}
                                name='travel_date' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.travel_date && <span className='text-red-500'>{prevError.travel_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Sector</label>
                            <input type="text" placeholder='Enter Sector' value={data.sector}
                                name='sector' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.sector && <span className='text-red-500'>{prevError.sector}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Airline</label>
                            <input type="text" placeholder='Enter Airline' value={data.airline}
                                name='airline' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />{prevError.airline && <span className='text-red-500'>{prevError.airline}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Passport Detail</label>
                            <input type="text" placeholder='Enter Passport Detail' value={data.passport_detail}
                                name='passport_detail' onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.passport_detail && <span className='text-red-500'>{prevError.passport_detail}</span>}
                        </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Receivable Amount </label>
                <input  type="text"   placeholder='Enter Receivable Amount' value={data.receivable_amount}
                    name='receivable_amount' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.receivable_amount && <span className='text-red-500'>{prevError.receivable_amount}</span>}
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
                <label className="block font-medium mb-1">Payable To Vendor</label>
                <input  type="number"   placeholder='Enter PayAble To Vendor' value={data.payable_to_vendor}
                    name='payable_to_vendor' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.payable_to_vendor && <span className='text-red-500'>{prevError.payable_to_vendor}</span>}
              </div>
              <div  className="w-full sm:w-[calc(50%-10px)]">
                <label className="block font-medium mb-1">Vendor Name</label>
                <input  type="text"   placeholder='Enter Vendor Name' value={data.vendor_name}
                    name='vendor_name' onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {prevError.vendor_name && <span className='text-red-500'>{prevError.vendor_name}</span>}
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

        

          <div className="mt-10 flex justify-center ">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-70 flex items-center justify-center bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <ButtonSpinner />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit'
              )}
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

export default Tickets_Form;