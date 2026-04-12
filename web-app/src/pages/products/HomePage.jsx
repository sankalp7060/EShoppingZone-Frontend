import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/products/ProductCard';
import DashboardHero from '../../components/common/DashboardHero';
import OurStoryModal from '../../components/common/OurStoryModal';
import './HomePage.css';

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showStoryModal, setShowStoryModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [currentPage, selectedCategory]);

    const loadInitialData = async () => {
        try {
            const catRes = await getCategories();
            if (catRes.success) {
                setCategories(['All', ...(catRes.data || [])]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await getProducts({
                page: currentPage,
                pageSize: 12,
                sortBy: 'newest',
                category: selectedCategory === 'All' ? '' : selectedCategory
            });

            if (response.success) {
                setProducts(response.data.products || []);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const isInitialLoad = categories.length === 0;

    if (isInitialLoad && loading) {
        return (
            <div className="home-loading">
                <div className="spinner"></div>
                <p>Curating premium products for you...</p>
            </div>
        );
    }

    return (
        <Layout>
            <div className="home-container">
                <DashboardHero 
                    onExplore={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}
                    onStory={() => setShowStoryModal(true)}
                />

                {/* Category Navigation */}
                <div className="category-nav-wrapper">
                    <div className="category-nav">
                        {categories.map(cat => (
                            <div 
                                key={cat} 
                                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                            >
                                {cat}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <main className="products-section" id="collection">
                    <div className="section-header">
                        <div className="section-title-group">
                            <h2>{selectedCategory === 'All' ? 'Featured Collection' : selectedCategory}</h2>
                            <p>Handpicked essentials from our {selectedCategory.toLowerCase()} catalog</p>
                        </div>
                    </div>

                    {!isInitialLoad && loading ? (
                        <div className="home-loading" style={{ minHeight: '400px', background: 'transparent' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-products">
                            <span className="empty-icon">📦</span>
                            <h3>No Products Found</h3>
                            <p>We couldn't find any products matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            <div className="products-grid">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav className="pagination" aria-label="Pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Previous page"
                                    >
                                        ‹
                                    </button>
                                    <div className="pagination-pages">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label="Next page"
                                    >
                                        ›
                                    </button>
                                </nav>
                            )}


                        </>
                    )}
                </main>

                {/* Our Story Modal */}
                <OurStoryModal 
                    isOpen={showStoryModal} 
                    onClose={() => setShowStoryModal(false)} 
                />
            </div>
        </Layout>
    );
};

export default HomePage;
