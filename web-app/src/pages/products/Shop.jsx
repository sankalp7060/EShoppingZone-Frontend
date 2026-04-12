import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts, getCategories, getProductTypes } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/products/ProductCard';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    SlidersHorizontal, 
    LayoutGrid, 
    Star,
    RefreshCw,
    X,
    ArrowUpDown
} from 'lucide-react';
import './Shop.css';

const Shop = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    
    // Parse query params
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const initialCategory = queryParams.get('category') || 'All';

    // State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [productTypes, setProductTypes] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedType, setSelectedType] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStock, setInStock] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSortDropdown && !e.target.closest('.custom-sort-container')) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSortDropdown]);

    const fetchMetadata = useCallback(async () => {
        try {
            const [catRes, typeRes] = await Promise.all([
                getCategories(),
                getProductTypes()
            ]);
            
            if (catRes.success) setCategories(['All', ...(catRes.data || [])]);
            if (typeRes.success) setProductTypes(['All', ...(typeRes.data || [])]);
        } catch (error) {
            console.error('Failed to load metadata');
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                searchTerm: searchTerm || undefined,
                category: selectedCategory === 'All' ? undefined : selectedCategory,
                productType: selectedType === 'All' ? undefined : selectedType,
                sortBy: sortBy,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                inStock: inStock || undefined,
                page: currentPage,
                pageSize: 12
            };

            const res = await getProducts(params);
            if (res.success) {
                setProducts(res.data.products || []);
                setTotalCount(res.data.totalCount || 0);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedCategory, selectedType, sortBy, minPrice, maxPrice, inStock, currentPage]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchProducts]);

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        setCurrentPage(1);
        const params = new URLSearchParams(location.search);
        if (cat === 'All') params.delete('category');
        else params.set('category', cat);
        navigate(`/shop?${params.toString()}`, { replace: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedType('All');
        setSortBy('newest');
        setMinPrice('');
        setMaxPrice('');
        setInStock(false);
        setCurrentPage(1);
    };

    return (
        <Layout>
            <div className={`shop-page ${showSidebar ? 'sidebar-open' : ''}`}>
                {/* Header Section */}
                <div className="shop-header">
                    <div className="shop-header-overlay"></div>
                    <div className="shop-header-content">
                        <div className="badge-premium">Exclusive Collection</div>
                        <h1>E-Shopping Zone</h1>
                        <p>Discover the pinnacle of digital craftsmanship and style</p>
                    </div>
                </div>

                <div className="shop-container">
                    {/* Toolbar */}
                    <div className="shop-toolbar-v3">
                        <div className="search-pill">
                            <Search className="pill-icon" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && <X className="pill-clear" size={16} onClick={() => setSearchTerm('')} />}
                        </div>

                        <div className="toolbar-controls">
                            <div className="custom-sort-container">
                                <button 
                                    className={`sort-trigger-v2 ${showSortDropdown ? 'active' : ''}`}
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                >
                                    <ArrowUpDown size={14} />
                                    <span>{
                                        sortBy === 'newest' ? 'Newest' :
                                        sortBy === 'price_asc' ? 'Price: Low-High' :
                                        sortBy === 'price_desc' ? 'Price: High-Low' :
                                        sortBy === 'rating' ? 'Top Rated' :
                                        sortBy === 'name_asc' ? 'A-Z' : 'Sort By'
                                    }</span>
                                    <ChevronDown size={14} className={`chevron ${showSortDropdown ? 'rotate' : ''}`} />
                                </button>
                                
                                {showSortDropdown && (
                                    <div className="sort-dropdown-menu">
                                        {[
                                            { v: 'newest', l: 'Newest First' },
                                            { v: 'price_asc', l: 'Price: Low to High' },
                                            { v: 'price_desc', l: 'Price: High to Low' },
                                            { v: 'rating', l: 'Top Rated' },
                                            { v: 'name_asc', l: 'Name: A - Z' }
                                        ].map(opt => (
                                            <div 
                                                key={opt.v}
                                                className={`sort-option ${sortBy === opt.v ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSortBy(opt.v);
                                                    setShowSortDropdown(false);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                {opt.l}
                                                {sortBy === opt.v && <div className="active-dot" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                className={`sidebar-trigger ${showSidebar ? 'active' : ''}`}
                                onClick={() => setShowSidebar(!showSidebar)}
                            >
                                <Filter size={18} />
                                <span>{showSidebar ? 'Hide Filters' : 'Filters'}</span>
                                { (selectedCategory !== 'All' || minPrice || maxPrice || inStock || selectedType !== 'All') && <div className="filter-dot"></div> }
                            </button>
                        </div>
                    </div>

                    <div className="shop-layout">
                        {/* Slide-out Sidebar */}
                        <aside className={`premium-sidebar ${showSidebar ? 'visible' : ''}`}>
                            <div className="sidebar-inner">
                                <div className="sidebar-section">
                                    <div className="section-title">
                                        <h3>Categories</h3>
                                        {selectedCategory !== 'All' && <button onClick={() => setSelectedCategory('All')}>Reset</button>}
                                    </div>
                                    <div className="category-cloud">
                                        {categories.map(cat => (
                                            <button 
                                                key={cat} 
                                                className={`cloud-item ${selectedCategory === cat ? 'active' : ''}`}
                                                onClick={() => handleCategoryClick(cat)}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="sidebar-section">
                                    <div className="section-title">
                                        <h3>Product Type</h3>
                                        {selectedType !== 'All' && <button onClick={() => setSelectedType('All')}>Reset</button>}
                                    </div>
                                    <div className="type-cloud">
                                        {productTypes.map(type => (
                                            <button 
                                                key={type} 
                                                className={`cloud-item type-item ${selectedType === type ? 'active' : ''}`}
                                                onClick={() => setSelectedType(type)}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="sidebar-section">
                                    <div className="section-title">
                                        <h3>Price Bracket</h3>
                                        {(minPrice || maxPrice) && <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Reset</button>}
                                    </div>
                                    <div className="price-bracket-v2">
                                        <div className="dynamic-input">
                                            <label>Min Price</label>
                                            <div className="input-wrap">
                                                <span>₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={minPrice} 
                                                    onChange={(e) => {
                                                        setMinPrice(e.target.value);
                                                        setCurrentPage(1);
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                        <div className="dynamic-input">
                                            <label>Max Price</label>
                                            <div className="input-wrap">
                                                <span>₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="100,000+" 
                                                    value={maxPrice} 
                                                    onChange={(e) => {
                                                        setMaxPrice(e.target.value);
                                                        setCurrentPage(1);
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-section">
                                    <div className="section-title">
                                        <h3>Stock Status</h3>
                                    </div>
                                    <label className="fancy-toggle">
                                        <div className="toggle-info">
                                            <span className="toggle-main">Strictly In-Stock</span>
                                            <span className="toggle-sub">Hide unavailable items</span>
                                        </div>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={inStock} onChange={() => {
                                                setInStock(!inStock);
                                                setCurrentPage(1);
                                            }} />
                                            <span className="slider round"></span>
                                        </div>
                                    </label>
                                </div>

                                <button className="reset-sidebar-btn" onClick={clearFilters}>
                                    <RefreshCw size={14} />
                                    Reset All Preferences
                                </button>
                            </div>
                        </aside>

                        {/* Main Grid Content */}
                        <main className="shop-content-v2">
                            {loading && (
                                <div className="shop-overlay-loader">
                                    <div className="loader-ring"></div>
                                    <span>Syncing collection...</span>
                                </div>
                            )}

                            <div className="grid-header">
                                <h2>{selectedCategory} {products.length > 0 ? `(${totalCount})` : ''}</h2>
                                <p>Discover products handpicked for quality and value</p>
                            </div>

                            {products.length === 0 && !loading ? (
                                <div className="refined-empty-state">
                                    <div className="empty-icon">📂</div>
                                    <h2>No matching items found</h2>
                                    <p>We couldn't find any products matching your current filters. Try relaxing your constraints.</p>
                                    <button onClick={clearFilters}>Reset Filters</button>
                                </div>
                            ) : (
                                <>
                                    <div className="product-grid-refined">
                                        {products.map(product => (
                                            <ProductCard key={product.id} product={product} showAddButton />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="pagination-v2">
                                            <button 
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                className="pag-nav"
                                            >
                                                Prev
                                            </button>
                                            <div className="pag-numbers">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                    <button 
                                                        key={p} 
                                                        className={currentPage === p ? 'active' : ''}
                                                        onClick={() => {
                                                            setCurrentPage(p);
                                                            window.scrollTo({ top: 300, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                className="pag-nav"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Shop;
