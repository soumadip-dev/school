import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAlumniData, getFilterOptions } from '../api/authApi';

const Alumni = () => {
  const [alumniData, setAlumniData] = useState([]);
  const [filteredAlumni, setFilteredAlumni] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('Alumni Student');
  const [batchFilter, setBatchFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [professionFilter, setProfessionFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [showOtherFilters, setShowOtherFilters] = useState(true);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    batches: [],
    cities: [],
    professions: [],
    classes: [],
  });
  const location = useLocation();

  const cardsPerPage = 10;

  // Initialize filter options and data
  useEffect(() => {
    fetchFilterOptions();
    fetchAlumniData();
  }, []);

  // Fetch alumni data when filters change
  useEffect(() => {
    fetchAlumniData();
  }, [roleFilter, batchFilter, cityFilter, professionFilter, classFilter, currentPage]);

  const fetchFilterOptions = async () => {
    try {
      const response = await getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      } else {
        setError('Failed to load filter options');
      }
    } catch (err) {
      setError('Error loading filter options');
    }
  };

  const fetchAlumniData = async () => {
    setLoading(true);
    setError('');

    const filters = {
      role: roleFilter,
      page: currentPage,
      limit: cardsPerPage,
    };

    // Add role-specific filters
    if (roleFilter === 'Alumni Student') {
      if (batchFilter !== 'all') filters.batch = batchFilter;
      if (cityFilter !== 'all') filters.city = cityFilter;
      if (professionFilter !== 'all') filters.profession = professionFilter;
    } else if (roleFilter === 'Present Student') {
      if (classFilter !== 'all') filters.class = classFilter;
    }

    try {
      const response = await getAlumniData(filters);
      if (response.success) {
        setAlumniData(response.data.alumni);
        setFilteredAlumni(response.data.alumni);

        // Update current page based on API response
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
        }
      } else {
        setError(response.message || 'Failed to load alumni data');
      }
    } catch (err) {
      setError('Error loading alumni data');
    } finally {
      setLoading(false);
    }
  };

  const generateId = (name, mobile) => {
    return name.slice(-2).toUpperCase() + (mobile ? mobile.slice(-3) : '000');
  };

  const handleRoleChange = e => {
    const value = e.target.value;
    setRoleFilter(value);
    setBatchFilter('all');
    setCityFilter('all');
    setProfessionFilter('all');
    setClassFilter('all');
    setCurrentPage(1);

    // Show/hide filters based on role
    if (value === 'Alumni Student') {
      setShowOtherFilters(true);
      setShowClassFilter(false);
    } else if (value === 'Present Student') {
      setShowOtherFilters(false);
      setShowClassFilter(true);
    } else {
      setShowOtherFilters(false);
      setShowClassFilter(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  // Calculate total pages based on API pagination or local data
  const totalPages = Math.ceil(filteredAlumni.length / cardsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e0e7ee] font-sans text-gray-800 overflow-x-hidden">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 w-full">
        <section className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 w-full transition-all duration-300 hover:shadow-xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#004D40] mb-3 bg-gradient-to-r from-[#004D40] to-[#00796B] bg-clip-text text-transparent">
              Jalpaiguri Zilla School Directory
            </h2>
            <div className="text-lg sm:text-xl text-[#004D40] font-semibold bg-[#E0F2F1] py-2 px-4 rounded-full inline-block">
              Total Registration:{' '}
              <span className="text-[#00796B] font-bold">{filteredAlumni.length}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-[#F5FBF9] rounded-2xl p-4 sm:p-6 mb-8 border border-[#E0F2F1]">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
              {/* Role Filter */}
              <div className="flex-1 min-w-[200px]">
                <label
                  htmlFor="roleFilter"
                  className="block font-bold mb-2 text-sm sm:text-base text-[#004D40]"
                >
                  Filter by Role:
                </label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-3 border-2 border-[#B2DFDB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-sm sm:text-base bg-white transition-all duration-200 hover:border-[#00796B]"
                >
                  <option value="Alumni Student">Alumni Student</option>
                  <option value="Alumni Teacher">Alumni Teacher</option>
                  <option value="Present Student">Present Student</option>
                  <option value="Present Teacher">Present Teacher</option>
                </select>
              </div>

              {/* Other Filters */}
              {showOtherFilters && (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="batchFilter"
                      className="block font-bold mb-2 text-sm sm:text-base text-[#004D40]"
                    >
                      Madhyamik Batch:
                    </label>
                    <select
                      id="batchFilter"
                      value={batchFilter}
                      onChange={e => setBatchFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#B2DFDB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-sm sm:text-base bg-white transition-all duration-200 hover:border-[#00796B]"
                    >
                      <option value="all">All Batches</option>
                      {filterOptions.batches.map((batch, index) => (
                        <option key={index} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cityFilter"
                      className="block font-bold mb-2 text-sm sm:text-base text-[#004D40]"
                    >
                      Present City:
                    </label>
                    <select
                      id="cityFilter"
                      value={cityFilter}
                      onChange={e => setCityFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#B2DFDB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-sm sm:text-base bg-white transition-all duration-200 hover:border-[#00796B]"
                    >
                      <option value="all">All Cities</option>
                      {filterOptions.cities.map((city, index) => (
                        <option key={index} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="professionFilter"
                      className="block font-bold mb-2 text-sm sm:text-base text-[#004D40]"
                    >
                      Profession:
                    </label>
                    <select
                      id="professionFilter"
                      value={professionFilter}
                      onChange={e => setProfessionFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#B2DFDB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-sm sm:text-base bg-white transition-all duration-200 hover:border-[#00796B]"
                    >
                      <option value="all">All Professions</option>
                      {filterOptions.professions.map((prof, index) => (
                        <option key={index} value={prof}>
                          {prof}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Class Filter */}
              {showClassFilter && (
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="selectClass"
                    className="block font-bold mb-2 text-sm sm:text-base text-[#004D40]"
                  >
                    Select Class:
                  </label>
                  <select
                    id="selectClass"
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#B2DFDB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-sm sm:text-base bg-white transition-all duration-200 hover:border-[#00796B]"
                  >
                    <option value="all">All Classes</option>
                    {filterOptions.classes.map((cls, index) => (
                      <option key={index} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D40]"></div>
              <p className="mt-4 text-gray-600">Loading alumni data...</p>
            </div>
          )}

          {/* Results Count */}
          {!loading && (
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm sm:text-base text-gray-600">
                Showing <span className="font-bold text-[#004D40]">{filteredAlumni.length}</span>{' '}
                results
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                Page <span className="font-bold text-[#004D40]">{currentPage}</span>
              </div>
            </div>
          )}

          {/* Alumni Grid */}
          {!loading && filteredAlumni.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 w-full">
              {filteredAlumni.map(alumnus => (
                <div
                  key={alumnus.id}
                  className="border-2 border-[#E0F2F1] rounded-2xl p-4 bg-white text-center shadow-md hover:shadow-2xl hover:scale-105 hover:border-[#004D40] transition-all duration-300 group"
                >
                  <div className="relative mb-3">
                    <img
                      src={alumnus.img || 'https://randomuser.me/api/portraits/men/1.jpg'}
                      alt={alumnus.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full mx-auto border-4 border-[#00796B] group-hover:border-[#004D40] transition-all duration-300 shadow-lg"
                    />
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-[#004D40] text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {alumnus.role}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-base sm:text-lg text-[#004D40] group-hover:text-[#00796B] transition-colors duration-300">
                      {alumnus.name} {alumnus.surname}
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      {alumnus.role === 'Present Student' ? (
                        <div className="bg-[#E8F5E8] py-1 px-2 rounded-lg font-medium text-[#2E7D32]">
                          Class: {alumnus.class}
                        </div>
                      ) : alumnus.role === 'Alumni Student' ? (
                        <>
                          <div className="bg-[#E3F2FD] py-1 px-2 rounded-lg font-medium text-[#1565C0]">
                            Batch: {alumnus.batch}
                          </div>
                          <div>📍 {alumnus.city}</div>
                          <div className="font-medium text-[#004D40]">{alumnus.profession}</div>
                          <div
                            className="text-xs text-gray-500 truncate"
                            title={alumnus.organization}
                          >
                            {alumnus.organization}
                          </div>
                        </>
                      ) : (
                        <div className="bg-[#F3E5F5] py-1 px-2 rounded-lg font-medium text-[#7B1FA2]">
                          📍 {alumnus.city}
                        </div>
                      )}
                    </div>
                    {(alumnus.role === 'Alumni Student' || alumnus.role === 'Present Student') && (
                      <div className="text-xs text-gray-500 bg-gray-100 py-1 px-2 rounded-lg font-mono">
                        ID: {generateId(alumnus.name, alumnus.mobile)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
              </div>
            )
          )}

          {/* Pagination */}
          {!loading && filteredAlumni.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 order-2 sm:order-1">Page {currentPage}</div>
              <div className="flex gap-2 order-1 sm:order-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 ${
                    currentPage === 1
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400'
                      : 'bg-[#004D40] text-white hover:bg-[#00332E] hover:shadow-lg transform hover:-translate-x-1'
                  }`}
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={filteredAlumni.length < cardsPerPage}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 ${
                    filteredAlumni.length < cardsPerPage
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400'
                      : 'bg-[#004D40] text-white hover:bg-[#00332E] hover:shadow-lg transform hover:translate-x-1'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Alumni;
