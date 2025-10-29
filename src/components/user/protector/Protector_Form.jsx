// src/components/forms/Protector_Form.jsx
import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

const SEPARATOR = '|';               // <-- change if you need another separator
const Protector_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
  const { user } = useAppContext();

  /* ------------------------------------------------------------------ */
  /*  1. ENTRY COUNTERS                                                 */
  /* ------------------------------------------------------------------ */
  const [entryNumber, setEntryNumber] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  /* ------------------------------------------------------------------ */
  /*  2. MAIN PERSON (single object – will be merged later)            */
  /* ------------------------------------------------------------------ */
  const [main, setMain] = useState({
    name: '',
    passport: '',
    reference: '',
    file_no: '',
    withdraw: '',
    employee: user?.username || '',
    mcb_fee_6000_date: '',
    ncb_fee_6700_date: '',
    ncb_fee_500_date: '',
    protector_date: '',
    additional_charges: '',
    entry: '0/0',
  });

  /* ------------------------------------------------------------------ */
  /*  3. ADDITIONAL PEOPLE (array of objects)                           */
  /* ------------------------------------------------------------------ */
  const [additionalPeople, setAdditionalPeople] = useState([]);

  /* ------------------------------------------------------------------ */
  /*  4. ERRORS                                                         */
  /* ------------------------------------------------------------------ */
  const [errors, setErrors] = useState({
    name: '',
    passport: '',
    reference: '',
    file_no: '',
    employee: '',
    mcb_fee_6000_date: '',
    ncb_fee_6700_date: '',
    ncb_fee_500_date: '',
    protector_date: '',
    additional_charges: '',
    general: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  5. HELPERS – merge / split                                        */
  /* ------------------------------------------------------------------ */
  const mergePeople = () => {
    const all = [main, ...additionalPeople].filter(p => p.name); // ignore empty rows
    const merged = {
      name: all.map(p => p.name).join(SEPARATOR),
      passport: all.map(p => p.passport).join(SEPARATOR),
      reference: all.map(p => p.reference).join(SEPARATOR),
      file_no: all.map(p => p.file_no).join(SEPARATOR),
    };
    console.log('MERGED PEOPLE →', merged);
    return merged;
  };

  const splitPeople = (str) => (str ? str.split(SEPARATOR).filter(Boolean) : []);

  /* ------------------------------------------------------------------ */
  /*  6. CALCULATE WITHDRAW                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const extra = parseInt(main.additional_charges) || 0;
    const base = 13200;
    const perExtra = additionalPeople.length * 13200;
    const withdraw = base + extra + perExtra;
    setMain((p) => ({ ...p, withdraw: withdraw.toString() }));
    console.log('WITHDRAW →', { base, extra, perExtra, withdraw });
  }, [main.additional_charges, additionalPeople.length]);

  /* ------------------------------------------------------------------ */
  /*  7. FETCH ENTRY COUNTS                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const getCounts = async () => {
      const counts = await fetchEntryCounts();
      if (counts) {
        const protector = counts.find((c) => c.form_type === 'protector');
        if (protector) {
          setEntryNumber(protector.current_count + 1);
          setTotalEntries(protector.global_count + 1);
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

  /* ------------------------------------------------------------------ */
  /*  8. UPDATE ENTRY FIELD (new form)                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editEntry) {
      setMain((p) => ({
        ...p,
        employee: user?.username || '',
        entry: `${entryNumber}/${totalEntries}`,
      }));
    }
  }, [entryNumber, totalEntries, user, editEntry]);

  /* ------------------------------------------------------------------ */
  /*  9. EDIT MODE – split pipe-separated strings back into array      */
  /* ------------------------------------------------------------------ */
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    const [_, month, day, year] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  useEffect(() => {
    if (editEntry) {
      console.log('EDIT MODE – raw data →', editEntry);

      // ---- MAIN (first person) ----
      const names = splitPeople(editEntry.name);
      const passports = splitPeople(editEntry.passport);
      const references = splitPeople(editEntry.reference);
      const fileNos = splitPeople(editEntry.file_no);

      // Take first as main, the rest as additional
      setMain({
        name: names[0] || '',
        passport: passports[0] || '',
        reference: references[0] || '',
        file_no: fileNos[0] || '',
        withdraw: editEntry.withdraw || '',
        employee: editEntry.employee || user?.username || '',
        mcb_fee_6000_date: formatDateForInput(editEntry.mcb_fee_6000_date),
        ncb_fee_6700_date: formatDateForInput(editEntry.ncb_fee_6700_date),
        ncb_fee_500_date: formatDateForInput(editEntry.ncb_fee_500_date),
        protector_date: formatDateForInput(editEntry.protector_date),
        additional_charges: editEntry.additional_charges || '',
        entry: editEntry.entry || `${entryNumber}/${totalEntries}`,
      });

      // ---- ADDITIONAL PEOPLE ----
      const extra = [];
      const max = Math.max(names.length, passports.length, references.length, fileNos.length);
      for (let i = 1; i < max; i++) {
        extra.push({
          name: names[i] || '',
          passport: passports[i] || '',
          reference: references[i] || '',
          file_no: fileNos[i] || '',
        });
      }
      setAdditionalPeople(extra);
      console.log('SPLIT → main:', main, 'additional:', extra);

      // ---- ENTRY NUMBERS ----
      if (editEntry.entry) {
        const [cur, tot] = editEntry.entry.split('/').map(Number);
        setEntryNumber(cur);
        setTotalEntries(tot);
      }
    }
  }, [editEntry, user?.username, entryNumber, totalEntries]);

  /* ------------------------------------------------------------------ */
  /* 10. HANDLERS                                                       */
  /* ------------------------------------------------------------------ */
  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMain((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handlePersonChange = (idx, field, value) => {
    const copy = [...additionalPeople];
    copy[idx] = { ...copy[idx], [field]: value };
    setAdditionalPeople(copy);
    console.log(`Person ${idx + 2} – ${field} →`, value);
  };

  const addPerson = () => {
    setAdditionalPeople((p) => [
      ...p,
      { name: '', passport: '', reference: '', file_no: '' },
    ]);
    console.log('ADDED extra person → new length:', additionalPeople.length + 1);
  };

  const removePerson = (idx) => {
    setAdditionalPeople((p) => p.filter((_, i) => i !== idx));
    console.log('REMOVED person at index', idx);
  };

  /* ------------------------------------------------------------------ */
  /* 11. VALIDATION                                                     */
  /* ------------------------------------------------------------------ */
  const validate = () => {
    const err = {};

    // ---- MAIN ----
    if (!main.name) err.name = 'Enter Name';
    if (!main.passport) err.passport = 'Enter Passport';
    if (!main.reference) err.reference = 'Enter Reference';
    if (!main.file_no) err.file_no = 'Enter File No';
    if (!main.employee) err.employee = 'Enter Employee';
    if (!main.mcb_fee_6000_date) err.mcb_fee_6000_date = 'Enter Date';
    if (!main.ncb_fee_6700_date) err.ncb_fee_6700_date = 'Enter Date';
    if (!main.ncb_fee_500_date) err.ncb_fee_500_date = 'Enter Date';
    if (!main.protector_date) err.protector_date = 'Enter Protector Date';
    if (!main.additional_charges) err.additional_charges = 'Enter Additional Charges';

    // ---- DATES ----
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const checkDate = (val, field) => {
      if (!val) return;
      if (!dateRegex.test(val)) {
        err[field] = 'Invalid date (yyyy-mm-dd)';
        return false;
      }
      const [y, m, d] = val.split('-').map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) {
        err[field] = 'Invalid date values';
        return false;
      }
      return true;
    };
    [
      'mcb_fee_6000_date',
      'ncb_fee_6700_date',
      'ncb_fee_500_date',
      'protector_date',
    ].forEach((f) => checkDate(main[f], f));

    // ---- ADDITIONAL PEOPLE ----
    additionalPeople.forEach((p, i) => {
      if (!p.name) err[`add_name_${i}`] = `Person ${i + 2}: Name required`;
      if (!p.passport) err[`add_passport_${i}`] = `Person ${i + 2}: Passport required`;
      if (!p.reference) err[`add_reference_${i}`] = `Person ${i + 2}: Reference required`;
      if (!p.file_no) err[`add_file_no_${i}`] = `Person ${i + 2}: File No required`;
    });

    setErrors(err);
    console.log('VALIDATION →', { isValid: Object.keys(err).length === 0, errors: err });
    return Object.keys(err).length === 0;
  };

  /* ------------------------------------------------------------------ */
  /* 12. SUBMIT – merge everything into the same columns                */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const merged = mergePeople();

    const payload = {
      ...main,                     // dates, employee, entry, etc.
      name: merged.name,
      passport: merged.passport,
      reference: merged.reference,
      file_no: merged.file_no,
      additional_charges: parseInt(main.additional_charges) || 0,
      // **NO** additional_people field – everything is now in the main columns
    };

    console.log('FINAL PAYLOAD (merged into main columns) →', payload);

    try {
      const url = editEntry
        ? `${BASE_URL}/protector/${editEntry.id}`
        : `${BASE_URL}/protector`;
      const method = editEntry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const json = await res.json();
      console.log('SERVER RESPONSE →', json);

      // ---- RESET ----
      setMain({
        name: '',
        passport: '',
        reference: '',
        file_no: '',
        withdraw: '',
        employee: user?.username || '',
        mcb_fee_6000_date: '',
        ncb_fee_6700_date: '',
        ncb_fee_500_date: '',
        protector_date: '',
        additional_charges: '',
        entry: `${entryNumber}/${totalEntries}`,
      });
      setAdditionalPeople([]);

      onSubmitSuccess?.(json);
    } catch (err) {
      console.error('SUBMIT ERROR →', err);
      setErrors((p) => ({ ...p, general: `Failed: ${err.message}` }));
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 13. RENDER                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex items-center justify-center bg-white p-4 min-h-screen">
      <div className="w-full max-w-3xl p-8 bg-white rounded-md shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative inline-block text-2xl font-semibold">
            PROTECTOR FORM
            <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-700 hover:text-gray-900">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ---------- MAIN FIELDS ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee */}
            <div>
              <label className="block font-medium mb-1">Employee</label>
              <input
                type="text"
                name="employee"
                value={main.employee}
                onChange={handleMainChange}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-1 bg-gray-100"
              />
              {errors.employee && <span className="text-red-500 text-sm">{errors.employee}</span>}
            </div>

            {/* Entry */}
            <div>
              <label className="block font-medium mb-1">Entry</label>
              <input
                type="text"
                value={main.entry}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-1 bg-gray-100"
              />
            </div>

            {/* Name, Passport, Reference, File No (MAIN) */}
            {['name', 'passport', 'reference', 'file_no'].map((field) => (
              <div key={field}>
                <label className="block font-medium mb-1 capitalize">
                  {field.replace('_', ' ')} (Person 1)
                </label>
                <input
                  type="text"
                  name={field}
                  value={main[field]}
                  onChange={handleMainChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {errors[field] && <span className="text-red-500 text-sm">{errors[field]}</span>}
              </div>
            ))}

            {/* Withdraw */}
            <div>
              <label className="block font-medium mb-1">Withdraw</label>
              <input
                type="text"
                value={main.withdraw}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-1 bg-gray-100"
              />
            </div>

            {/* Dates */}
            {[
              { key: 'mcb_fee_6000_date', label: 'MCB FEE / 6000 DATE' },
              { key: 'ncb_fee_6700_date', label: 'NCB FEE / 6700 DATE' },
              { key: 'ncb_fee_500_date', label: 'NCB FEE / 500 DATE' },
              { key: 'protector_date', label: 'Protector Date' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block font-medium mb-1">{label}</label>
                <input
                  type="date"
                  name={key}
                  value={main[key]}
                  onChange={handleMainChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {errors[key] && <span className="text-red-500 text-sm">{errors[key]}</span>}
              </div>
            ))}

            {/* Additional Charges */}
            <div>
              <label className="block font-medium mb-1">Additional Charges</label>
              <input
                type="number"
                name="additional_charges"
                value={main.additional_charges}
                onChange={handleMainChange}
                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {errors.additional_charges && (
                <span className="text-red-500 text-sm">{errors.additional_charges}</span>
              )}
            </div>
          </div>

          {/* ---------- ADDITIONAL PEOPLE ---------- */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Additional People</h3>
              <button
                type="button"
                onClick={addPerson}
                className="bg-purple-500 text-white w-10 h-10 rounded-full hover:bg-purple-600 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>

            {additionalPeople.map((person, idx) => (
              <div
                key={idx}
                className="mb-6 p-4 border border-gray-300 rounded-md bg-gray-50 relative"
              >
                <button
                  type="button"
                  onClick={() => removePerson(idx)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl"
                >
                  ×
                </button>

                <h4 className="font-medium mb-3 text-gray-700">Person {idx + 2}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['name', 'passport', 'reference', 'file_no'].map((field) => (
                    <div key={field}>
                      <label className="block font-medium mb-1 capitalize">
                        {field.replace('_', ' ')}
                      </label>
                      <input
                        type="text"
                        value={person[field] || ''}
                        onChange={(e) => handlePersonChange(idx, field, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      {errors[`add_${field}_${idx}`] && (
                        <span className="text-red-500 text-sm">
                          {errors[`add_${field}_${idx}`]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ---------- GENERAL ERROR ---------- */}
          {errors.general && (
            <div className="text-red-500 text-center">{errors.general}</div>
          )}

          {/* ---------- SUBMIT / CANCEL ---------- */}
          <div className="mt-10 flex justify-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-md hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              {isLoading && <ButtonSpinner />}
              {editEntry ? 'Update' : 'Submit'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-8 py-3 bg-gray-300 text-black font-medium rounded-md hover:bg-gray-400 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Protector_Form;