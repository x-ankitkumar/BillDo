import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Settings, FileText, User, ListPlus, Briefcase } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

type Service = {
  id: string;
  name: string;
  price: number;
};

type LineItem = {
  id: string;
  serviceId: string;
  quantity: number;
};

type InvoiceDetails = {
  agencyName: string;
  agencyAddress: string;
  clientName: string;
  clientAddress: string;
  invoiceDate: string;
  invoiceNumber: string;
  taxType: string;
  taxRate: number;
};

export default function App() {
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    agencyName: 'Digital Agency',
    agencyAddress: '100 Innovation Drive\nTech District, CA 94105\nhello@digitalagency.com\n+1 (555) 123-4567',
    clientName: '',
    clientAddress: '',
    invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
    taxType: 'GST',
    taxRate: 0,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  // Load services and logo from localStorage on mount
  useEffect(() => {
    const savedServices = localStorage.getItem('invoice_services');
    if (savedServices) {
      try {
        setServices(JSON.parse(savedServices));
      } catch (e) {
        console.error('Failed to parse services from localStorage', e);
      }
    }
    const savedLogo = localStorage.getItem('invoice_logo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  // Save services to localStorage when updated
  useEffect(() => {
    localStorage.setItem('invoice_services', JSON.stringify(services));
  }, [services]);

  // Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
        localStorage.setItem('invoice_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    localStorage.removeItem('invoice_logo');
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;

    const newService: Service = {
      id: crypto.randomUUID(),
      name: newServiceName.trim(),
      price: parseFloat(newServicePrice),
    };

    setServices([...services, newService]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    // Also remove from line items if it was selected
    setLineItems(lineItems.filter((item) => item.serviceId !== id));
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        serviceId: '',
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDownloadPDF = () => {
    if (!previewRef.current) return;

    const element = previewRef.current;
    const opt: any = {
      margin: [10, 10, 10, 10],
      filename: `Invoice_${invoiceDetails.invoiceNumber || 'Draft'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => {
    const service = services.find((s) => s.id === item.serviceId);
    if (service) {
      return sum + service.price * item.quantity;
    }
    return sum;
  }, 0);

  const taxAmount = subtotal * (invoiceDetails.taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      {/* Left Column: Controls */}
      <div className="w-full lg:w-1/2 p-6 lg:p-10 overflow-y-auto border-r border-slate-200">
        <div className="max-w-2xl mx-auto space-y-10">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-indigo-600" />
              BillDo
            </h1>
            <p className="text-slate-500 mt-2">Manage your services and generate professional invoices instantly.</p>
          </div>

          {/* 1. Service Management Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              Service Catalog
            </h2>
            
            <form onSubmit={handleAddService} className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Service Name</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Web Design"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </form>

            {services.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Saved Services</label>
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {services.map((service) => (
                    <li key={service.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <span className="font-medium text-sm">{service.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600 text-sm">₹{service.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveService(service.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-sm text-slate-500">No services added yet. Add your first service above.</p>
              </div>
            )}
          </section>

          {/* 2. Invoice Details Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Invoice Details
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 mb-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Agency Logo</label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative group">
                      <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain rounded border border-slate-200" />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg">
                      <Briefcase className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Recommended: PNG or JPG, max 1MB.</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Agency Name</label>
                <input
                  type="text"
                  value={invoiceDetails.agencyName}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, agencyName: e.target.value })}
                  placeholder="Digital Agency"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Agency Address & Contact</label>
                <textarea
                  value={invoiceDetails.agencyAddress}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, agencyAddress: e.target.value })}
                  placeholder="100 Innovation Drive&#10;Tech District, CA 94105&#10;hello@digitalagency.com&#10;+1 (555) 123-4567"
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <hr className="my-2 border-slate-200" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Client Name</label>
                <input
                  type="text"
                  value={invoiceDetails.clientName}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, clientName: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Client Address</label>
                <textarea
                  value={invoiceDetails.clientAddress}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, clientAddress: e.target.value })}
                  placeholder="123 Business Rd&#10;Suite 100&#10;City, State 12345"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDetails.invoiceDate}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceDetails.invoiceNumber}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tax Type</label>
                <select
                  value={invoiceDetails.taxType}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, taxType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="None">None</option>
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                  <option value="CGST">CGST</option>
                  <option value="SGST">SGST</option>
                  <option value="TDS">TDS</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={invoiceDetails.taxRate}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  disabled={invoiceDetails.taxType === 'None'}
                />
              </div>
            </div>
          </section>

          {/* 3. Invoice Line Items Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-slate-400" />
                Line Items
              </h2>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                <p className="text-sm text-amber-700">Please add services to your catalog first.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {lineItems.map((item, index) => {
                  const selectedService = services.find((s) => s.id === item.serviceId);
                  const price = selectedService ? selectedService.price : 0;
                  const total = price * item.quantity;

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Service</label>
                        <select
                          value={item.serviceId}
                          onChange={(e) => handleLineItemChange(item.id, 'serviceId', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                        >
                          <option value="" disabled>Select a service...</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Price</label>
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm h-[42px] flex items-center">
                          ₹{price.toFixed(2)}
                        </div>
                      </div>
                      <div className="w-full sm:w-24">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total</label>
                        <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-mono font-medium text-sm h-[42px] flex items-center">
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full p-1.5 shadow-sm transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleAddLineItem}
              disabled={services.length === 0}
              className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Another Item
            </button>
          </section>
        </div>
      </div>

      {/* Right Column: Live Preview & Download */}
      <div className="w-full lg:w-1/2 bg-slate-200 p-6 lg:p-10 flex flex-col items-center overflow-y-auto relative">
        <div className="w-full max-w-[210mm] sticky top-0 z-10 flex justify-end mb-6">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            Download as PDF
          </button>
        </div>

        {/* The Printable Invoice Container */}
        <div 
          className="w-full max-w-[210mm] bg-white shadow-xl rounded-sm overflow-hidden" 
          style={{ minHeight: '297mm' }} // A4 aspect ratio approximation
        >
          <div ref={previewRef} className="p-10 sm:p-14 bg-white text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Agency Logo" className="h-12 w-auto object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  )}
                  {!logoUrl && <h1 className="text-3xl font-bold tracking-tight text-slate-900">{invoiceDetails.agencyName || 'Agency Name'}</h1>}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                  {invoiceDetails.agencyAddress || 'Agency Address'}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-4">Invoice</h2>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold text-slate-700">Invoice No:</span> <span className="text-slate-500">{invoiceDetails.invoiceNumber || '—'}</span></p>
                  <p><span className="font-semibold text-slate-700">Date:</span> <span className="text-slate-500">{invoiceDetails.invoiceDate ? format(new Date(invoiceDetails.invoiceDate), 'MMM dd, yyyy') : '—'}</span></p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-12">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2">Bill To</h3>
              <p className="font-semibold text-lg text-slate-800">{invoiceDetails.clientName || 'Client Name'}</p>
              <p className="text-sm text-slate-500 whitespace-pre-line mt-1">
                {invoiceDetails.clientAddress || 'Client Address\nCity, State, Zip'}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800">
                    <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider">Description</th>
                    <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider text-right w-24">Price</th>
                    <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider text-right w-20">Qty</th>
                    <th className="py-3 px-2 text-xs font-bold text-slate-800 uppercase tracking-wider text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.length > 0 ? (
                    lineItems.map((item, index) => {
                      const service = services.find((s) => s.id === item.serviceId);
                      const price = service ? service.price : 0;
                      const total = price * item.quantity;
                      
                      return (
                        <tr key={item.id} className="group">
                          <td className="py-4 px-2 text-sm text-slate-800 font-medium">
                            {service ? service.name : <span className="text-slate-400 italic">Select a service...</span>}
                          </td>
                          <td className="py-4 px-2 text-sm text-slate-600 text-right font-mono">₹{price.toFixed(2)}</td>
                          <td className="py-4 px-2 text-sm text-slate-600 text-right">{item.quantity}</td>
                          <td className="py-4 px-2 text-sm text-slate-800 font-medium text-right font-mono">₹{total.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-400 italic border-b border-slate-200">
                        No items added to this invoice yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 lg:w-2/3 xl:w-1/2">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-slate-800 font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {invoiceDetails.taxRate > 0 && invoiceDetails.taxType !== 'None' && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">{invoiceDetails.taxType} ({invoiceDetails.taxRate}%)</span>
                      <span className="text-slate-800 font-mono">₹{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-4 border-t-2 border-slate-800 mt-2">
                    <span className="text-lg font-bold text-slate-900">Total Due</span>
                    <span className="text-xl font-bold text-indigo-600 font-mono">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-24 pt-8 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-medium">Thank you for your business!</p>
              <p className="text-xs text-slate-400 mt-1">Payment is due within 30 days. Please make checks payable to {invoiceDetails.agencyName || 'Digital Agency'}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
