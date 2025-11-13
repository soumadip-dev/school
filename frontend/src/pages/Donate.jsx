import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const Donate = () => {
  const [activeTab, setActiveTab] = useState('batch');

  // Sample data for tables
  const batchData = Array.from({ length: 25 }, (_, i) => [`19${80 + i}`, `₹${(i + 1) * 1000}`]);
  const topData = Array.from({ length: 30 }, (_, i) => [`Name ${i + 1}`, `19${70 + (i % 30)}`, `₹${20000 - i * 200}`]);
  const dateData = Array.from({ length: 40 }, (_, i) => [`Donor ${i + 1}`, `20${10 + (i % 15)}`, `₹${1000 + (i % 7) * 500}`]);

  // Pagination states
  const [batchPage, setBatchPage] = useState(1);
  const [topPage, setTopPage] = useState(1);
  const [datePage, setDatePage] = useState(1);
  const rowsPerPage = 10;

  // Calculate paginated data
  const getPaginatedData = (data, currentPage) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = (data) => Math.ceil(data.length / rowsPerPage);

  // Handle payment gateway clicks
  const handlePaymentClick = (gateway) => {
    toast.error(`${gateway} integration pending`);
  };

  // Render pagination buttons
  const renderPagination = (currentPage, totalPages, setPage) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-lg transition-colors duration-200 ${
            currentPage === i
              ? 'bg-[#00332E] text-white'
              : 'bg-[#004D40] text-white hover:bg-[#00796B]'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-3xl font-bold text-[#004D40] mb-6 text-center">
            Support Our 150 Years Celebration
          </h2>

          {/* Payment Section */}
          <div className="bg-white rounded-lg p-8 text-center max-w-2xl mx-auto mb-8 shadow-md border border-gray-100">
            <h3 className="text-2xl font-semibold text-[#004D40] mb-4">Make a Donation</h3>
            <p className="text-gray-700 mb-6 text-lg">
              Support the 150-year celebration of Jalpaiguri Zilla School. Choose a payment gateway to contribute:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => handlePaymentClick('Stripe')}
                className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Pay with Stripe
              </button>
              <button
                onClick={() => handlePaymentClick('Razorpay')}
                className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Pay with Razorpay
              </button>
              <button
                onClick={() => handlePaymentClick('PayPal')}
                className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00796B] transition-colors duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Pay with PayPal
              </button>
            </div>
          </div>

          {/* View Donations Section */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-[#004D40] mb-6 text-center">View Donations</h3>
            
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <button
                onClick={() => setActiveTab('batch')}
                className={`px-6 py-3 rounded-lg transition-colors duration-200 font-semibold ${
                  activeTab === 'batch'
                    ? 'bg-[#00332E] text-white'
                    : 'bg-[#004D40] text-white hover:bg-[#00796B]'
                }`}
              >
                Batch-wise Totals
              </button>
              <button
                onClick={() => setActiveTab('top')}
                className={`px-6 py-3 rounded-lg transition-colors duration-200 font-semibold ${
                  activeTab === 'top'
                    ? 'bg-[#00332E] text-white'
                    : 'bg-[#004D40] text-white hover:bg-[#00796B]'
                }`}
              >
                Top 100 Contributors
              </button>
              <button
                onClick={() => setActiveTab('date')}
                className={`px-6 py-3 rounded-lg transition-colors duration-200 font-semibold ${
                  activeTab === 'date'
                    ? 'bg-[#00332E] text-white'
                    : 'bg-[#004D40] text-white hover:bg-[#00796B]'
                }`}
              >
                Date-wise Contributions
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              {/* Batch-wise Totals */}
              {activeTab === 'batch' && (
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-[#004D40] mb-4">Batch-wise Total Payments</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#004D40] text-white">
                          <th className="px-4 py-3 text-left font-semibold">Madhyamik Batch</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedData(batchData, batchPage).map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">{row[0]}</td>
                            <td className="px-4 py-3 font-semibold text-green-700">{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center gap-2 mt-6">
                    {renderPagination(batchPage, getTotalPages(batchData), setBatchPage)}
                  </div>
                </div>
              )}

              {/* Top Contributors */}
              {activeTab === 'top' && (
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-[#004D40] mb-4">Top 100 Contributors</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#004D40] text-white">
                          <th className="px-4 py-3 text-left font-semibold">Name</th>
                          <th className="px-4 py-3 text-left font-semibold">Batch</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedData(topData, topPage).map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">{row[0]}</td>
                            <td className="px-4 py-3">{row[1]}</td>
                            <td className="px-4 py-3 font-semibold text-green-700">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center gap-2 mt-6">
                    {renderPagination(topPage, getTotalPages(topData), setTopPage)}
                  </div>
                </div>
              )}

              {/* Date-wise Contributions */}
              {activeTab === 'date' && (
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-[#004D40] mb-4">Date-wise Individual Contributions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#004D40] text-white">
                          <th className="px-4 py-3 text-left font-semibold">Name</th>
                          <th className="px-4 py-3 text-left font-semibold">Batch</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedData(dateData, datePage).map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">{row[0]}</td>
                            <td className="px-4 py-3">{row[1]}</td>
                            <td className="px-4 py-3 font-semibold text-green-700">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-center gap-2 mt-6">
                    {renderPagination(datePage, getTotalPages(dateData), setDatePage)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Donate;