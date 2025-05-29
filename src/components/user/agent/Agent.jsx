import React, { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../../contexts/AppContext';
import TableSpinner from '../../ui/TableSpinner';
import Table from '../../ui/Table';
import axios from 'axios';
import AgentForm from './Agent_Form';

const Agent = () => {

    const {user}=useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [data,setData]=useState([]);
    const [showForm,setShowForm] = useState(false);

    const fetchData = async ()=>{
        try{
            setIsLoading(true);
            const response =  await axios.get('http://localhost:8787/agent')
            setData(response.data.agents?.reverse());
            console.log(response.data.agents)
        }
        catch(error){
            setError(error.message);
            console.error("Error Fetching Data",error.message);
        }
        finally {
            setIsLoading(false);
        }
    }

    useEffect (()=>{
        fetchData();
    },[])

    const onCancel = () => {
        setShowForm(false);
    };

    const columns = useMemo(() => [
        { header: 'DATE', accessor: 'date' },
        {header:'EMPLOYEE', accessor:'employee'},
        {header:'ENTRY', accessor:'entry'},
        { header: 'DETAIL', accessor: 'detail' },
        { header: 'CREDIT', accessor: 'credit' },
        { header: 'DEBIT', accessor: 'debit' },
        { header: 'BALANCE', accessor: 'balance' },
        ...(user.role === 'admin'
            ? [
                  {
                      header: 'ACTIONS',
                      accessor: 'actions',
                      render: (row, index) => (
                          <>
                              <button
                                  className="text-blue-500 hover:text-blue-700 mr-3"
                                //   onClick={() => handleUpdate(index)}
                                //   disabled={loadingActionId === index.id}
                              >
                                  {/* {loadingActionId === index.id ? <ButtonSpinner /> : <i className="fas fa-edit"></i>} */}
                                  <i className="fas fa-edit"></i>
                              </button>
                              <button
                                  className="text-red-500 hover:text-red-700"
                                //   onClick={() => openDeleteModal(index.id)}
                                //   disabled={loadingActionId === index.id}
                              >
                                  <i className="fas fa-trash"></i>
                              </button>
                          </>
                      ),
                  },
              ]
            : []),
    ], [user.role,]);
    
    return (
        <div className='flex flex-col h-full'>
           {showForm ? (
                <AgentForm onCancel={onCancel}/> // Render the form when showForm is true
            ) : (
                <>
                    <div className='flex justify-between items-center mb-4 relative'>
                        <select className="p-2 border border-gray-300 rounded-md">
                            Agent1
                        </select>
                        <button
                            className="font-semibold text-sm bg-white rounded-md shadow px-4 py-2 hover:bg-purple-700 hover:text-white transition-colors duration-200"
                            onClick={() => setShowForm(true)} // Toggle form display
                        >
                            <i className="fas fa-plus mr-1"></i> Add New
                        </button>
                    </div>
                    <div>
                        {isLoading ? (
                            <TableSpinner />
                        ) : error ? (
                            <div className="flex items-center justify-center w-full h-64">
                                <div className="text-red-500">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    {error}
                                </div>
                            </div>
                        ) : (
                            <Table columns={columns} data={data.length ? data : []} />
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default Agent