import * as React from "react";
import { Button } from "uxp/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import './pagination.scss';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    itemsPerPage, 
    setCurrentPage, 
    setItemsPerPage 
}) => {
    return (
        <div className="pagination-container">
            <div className="pagination-controls">
                <select 
                    className="items-per-page" 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                </select>
                
                <div className="pagination-buttons">
                    <button
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="pagination-arrow" />
                    </button>
                    
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    
                    <button
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="pagination-arrow" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;