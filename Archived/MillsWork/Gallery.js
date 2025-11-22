import React from 'react';

const Gallery = () => (
  <div className="container my-5">
    <h2 className="text-light">Gallery</h2>
    <div className="row">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="col-md-4 mb-4" key={index}>
          <div className="card bg-dark text-light">
            <img src={`https://via.placeholder.com/300?text=Image+${index + 1}`} alt={`Placeholder ${index + 1}`} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">Placeholder {index + 1}</h5>
              <p className="card-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <a href="#" className="btn btn-outline-light">View</a>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Gallery;
