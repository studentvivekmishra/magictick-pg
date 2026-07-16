'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ShieldCheck, ArrowLeft, RefreshCw, FileText } from 'lucide-react';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the payment details from a client-side call
    const fetchPayment = async () => {
      try {
        const res = await fetch('/api/payments');
        const paymentsList = await res.json();
        
        // Find this specific payment record
        const found = paymentsList.find((p: any) => p.id === paymentId);
        setPayment(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Generating receipt layout...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 p-6 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-sm shadow-sm space-y-4">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">Receipt Not Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested payment invoice could not be located or verified in the active records.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const cycleName = new Date(payment.dueDate).toLocaleString('default', { month: 'long', year: 'numeric' });
  const paidDateFormatted = payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'N/A';
  const billNo = `RCPT-${payment.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-800 antialiased print:bg-white print:py-0 print:px-0">
      
      {/* Action panel - hidden on print */}
      <div className="max-w-2xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Receipt Box */}
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl shadow-sm relative print:border-none print:shadow-none print:p-0">
        
        {/* Paid Stamp background decoration */}
        <div className="absolute top-8 right-8 border-4 border-emerald-500/30 text-emerald-500/30 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-xl rotate-12 select-none print:border-emerald-500 print:text-emerald-500">
          Paid &amp; Verified
        </div>

        {/* Invoice Header */}
        <div className="border-b pb-6 flex flex-col sm:flex-row justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-blue-600 tracking-tight flex items-center gap-1">
              <FileText className="w-5 h-5" />
              <span>MagicTick PG System</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Premium Housing Accommodations</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase">Payment Receipt</h2>
            <p className="text-xs text-slate-500 font-medium">Receipt No: <span className="font-mono font-bold text-slate-900">{billNo}</span></p>
            <p className="text-xs text-slate-500 font-medium">Date Issued: <span className="font-bold text-slate-900">{paidDateFormatted}</span></p>
          </div>
        </div>

        {/* Details section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resident Guest Details</h4>
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-slate-900">{payment.customer?.name}</p>
              <p className="text-slate-500 font-medium">Phone: <span className="text-slate-700 font-bold">{payment.customer?.phone}</span></p>
              <p className="text-slate-500 font-medium">Email: <span className="text-slate-700 font-bold">{payment.customer?.email}</span></p>
              {payment.roomAllocation && (
                <p className="text-slate-500 font-medium">
                  Stay: <span className="text-slate-750 font-bold">Room {payment.roomAllocation.room?.roomNumber} (Bed {payment.roomAllocation.bed?.bedNumber.split('-')[1]})</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Details</h4>
            <div className="space-y-1 text-xs">
              <p className="text-slate-500 font-medium">Billing Cycle: <span className="text-slate-750 font-bold">{cycleName}</span></p>
              <p className="text-slate-500 font-medium">Payment Mode: <span className="text-slate-750 font-bold">{payment.paymentMode || 'UPI / Transfer'}</span></p>
              <p className="text-slate-500 font-medium">Transaction ID: <span className="font-mono text-slate-750 font-bold select-all">{payment.transactionId || 'Direct Settlement'}</span></p>
              <p className="text-slate-500 font-medium">Approval Date: <span className="text-slate-750 font-bold">{paidDateFormatted}</span></p>
            </div>
          </div>
        </div>

        {/* Invoice Itemized table */}
        <div className="py-8 space-y-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receipt Summary</h4>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b">
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-4 font-bold text-slate-800">Room Rent Charges ({cycleName})</td>
                  <td className="p-4 text-right font-semibold text-slate-900">₹{payment.amount}</td>
                </tr>
                {payment.lateFee > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="p-4 text-rose-600 font-bold">Late Penalty Surcharge</td>
                    <td className="p-4 text-right font-semibold text-rose-600">₹{payment.lateFee}</td>
                  </tr>
                )}
                {payment.discount > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="p-4 text-emerald-600 font-bold">Operational Discount Applied</td>
                    <td className="p-4 text-right font-semibold text-emerald-600">-₹{payment.discount}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-extrabold text-slate-900">
                  <td className="p-4 text-sm font-black">Total Paid Amount</td>
                  <td className="p-4 text-right text-sm font-black text-blue-600">
                    ₹{payment.amount + payment.lateFee - payment.discount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer legalities */}
        <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mt-12">
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Help &amp; Queries</p>
            <p className="text-[10px] text-slate-500 font-medium">For support, please raise a ticket via your MagicTick desk.</p>
          </div>

          <div className="flex gap-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="space-y-8">
              <div className="w-24 border-b border-slate-200 mx-auto" />
              <span>Tenant Signature</span>
            </div>
            <div className="space-y-8">
              <div className="w-24 border-b border-slate-200 mx-auto" />
              <span>Authorized Sign</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
