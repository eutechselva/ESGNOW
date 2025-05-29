### Using the Project-Product API

The Project-Product API allows you to manage the relationship between projects and products, including transportation details. Here's how to use the main endpoints:

#### Creating a Project with Products

1. First, create a project using the project API (`POST /api/projects`)
2. Create products using the product API (`POST /api/products`) 
3. Associate products with the project by creating a mapping:
   ```
   POST /api/project-product-mapping
   ```
   - Include the `projectID` and an array of `products`
   - Each product must have a `productID` and can have multiple `transportationLegs`

#### Managing Products in a Project

1. **Adding a Product by Mapping ID**: To add a product to an existing project-product mapping:
   ```
   POST /api/project-product-mapping/:id/product
   ```
   Where `:id` is the ID of the project-product mapping

2. **Adding a Product Directly to a Project**: To add a product directly to a project:
   ```
   POST /api/project-product-mapping/project/:projectID/product
   ```
   Where `:projectID` is the ID of the project. This will create a mapping if none exists.

3. **Removing a Product by Mapping ID**: To remove a product from a project-product mapping:
   ```
   DELETE /api/project-product-mapping/:id/product/:productID
   ```
   Where `:id` is the mapping ID and `:productID` is the product to remove

4. **Removing a Product Directly from a Project**: To remove a product directly from a project:
   ```
   DELETE /api/project-product-mapping/project/:projectID/product/:productID
   ```
   Where `:projectID` is the project ID and `:productID` is the product to remove

5. **Updating the Mapping**: To update the entire mapping:
   ```
   PUT /api/project-product-mapping/:id
   ```
   This allows updating multiple products in a single request

#### Retrieving Project-Product Data

1. **Get by Project ID**: To get all products associated with a project:
   ```
   GET /api/project-product-mapping/project/:projectID
   ```

2. **Get by Product ID**: To find all projects that contain a specific product:
   ```
   GET /api/project-product-mapping/product/:productID
   ```

## API Endpoints

### Products

#### Get All Products
```bash
curl -X GET http://localhost:5009/api/products \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "code": "PROD-001",
      "name": "Product Name",
      "description": "Product Description",
      "weight": 10,
      "countryOfOrigin": "USA",
      "category": "Electronics",
      "subCategory": "Computers",
      "supplierName": "Supplier Inc.",
      "co2Emission": 42.2,
      "co2EmissionRawMaterials": 41,
      "co2EmissionFromProcesses": 1.2,
      "materials": [
        {
          "materialClass": "Metal",
          "specificMaterial": "Aluminum",
          "weight": 5,
          "unit": "kg",
          "emissionFactor": 8.2
        }
      ],
      "productManufacturingProcess": [
        {
          "materialClass": "Metal",
          "specificMaterial": "Aluminum",
          "weight": 5,
          "emissionFactor": 1.2,
          "manufacturingProcesses": [
            {
              "category": "Cutting",
              "processes": ["Laser cutting", "CNC machining"]
            }
          ]
        }
      ],
      "createdDate": "2023-01-01T00:00:00.000Z",
      "modifiedDate": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Product by ID
```bash
curl -X GET http://localhost:5009/api/products/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Create a New Product
```bash
curl -X POST http://localhost:5009/api/products \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "code": "PROD-001",
    "name": "Product Name",
    "description": "Product Description",
    "weight": 10,
    "countryOfOrigin": "USA",
    "category": "Electronics",
    "subCategory": "Computers",
    "supplierName": "Supplier Inc.",
    "materials": [
      {
        "materialClass": "Metal",
        "specificMaterial": "Aluminum",
        "weight": 5,
        "unit": "kg",
        "emissionFactor": 8.2
      }
    ],
    "productManufacturingProcess": [
      {
        "materialClass": "Metal",
        "specificMaterial": "Aluminum",
        "weight": 5,
        "emissionFactor": 1.2,
        "manufacturingProcesses": [
          {
            "category": "Cutting",
            "processes": ["Laser cutting", "CNC machining"]
          }
        ]
      }
    ]
  }'
```

#### Update a Product
```bash
curl -X PUT http://localhost:5009/api/products/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "name": "Updated Product Name",
    "description": "Updated Product Description"
  }'
```

#### Delete a Product
```bash
curl -X DELETE http://localhost:5009/api/products/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Delete All Products
```bash
curl -X DELETE http://localhost:5009/api/products \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

### Projects

#### Get All Projects
```bash
curl -X GET http://localhost:5009/api/projects \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Get Project by ID
```bash
curl -X GET http://localhost:5009/api/projects/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Create a New Project
```bash
curl -X POST http://localhost:5009/api/projects \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "name": "Project Name",
    "description": "Project Description",
    "client": "Client Name",
    "location": "Project Location",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  }'
```

#### Update a Project
```bash
curl -X PUT http://localhost:5009/api/projects/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated Project Description"
  }'
```

#### Delete a Project
```bash
curl -X DELETE http://localhost:5009/api/projects/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

### Project-Product Mappings

#### Create Project-Product Mapping (Multiple Products)
```bash
curl -X POST http://localhost:5009/api/project-product-mapping \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [
      {
        "productID": "60d21b4667d0d8992e610c86",
        "packagingWeight": 1.5,
        "palletWeight": 5,
        "totalTransportationEmission": 125.6,
        "transportationLegs": [
          {
            "transportMode": "Truck",
            "originCountry": "China",
            "destinationCountry": "India",
            "originGateway": "Shanghai",
            "destinationGateway": "Mumbai",
            "transportEmission": 78.3,
            "transportDistance": 4500
          },
          {
            "transportMode": "Ship",
            "originCountry": "USA",
            "destinationCountry": "UK",
            "originGateway": "Los Angeles",
            "destinationGateway": "London",
            "transportEmission": 47.3,
            "transportDistance": 8900
          }
        ]
      },
      {
        "productID": "60d21b4667d0d8992e610c87",
        "packagingWeight": 0.8,
        "palletWeight": 3,
        "totalTransportationEmission": 85.2,
        "transportationLegs": [
          {
            "transportMode": "Air",
            "originCountry": "Germany",
            "destinationCountry": "USA",
            "originGateway": "Frankfurt",
            "destinationGateway": "New York",
            "transportEmission": 85.2,
            "transportDistance": 6300
          }
        ]
      }
    ]
  }'
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "productID": "60d21b4667d0d8992e610c86",
        "packagingWeight": 1.5,
        "palletWeight": 5,
        "totalTransportationEmission": 125.6,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c90",
            "transportMode": "Truck",
            "originCountry": "China",
            "destinationCountry": "India",
            "originGateway": "Shanghai",
            "destinationGateway": "Mumbai",
            "transportEmission": 78.3,
            "transportDistance": 4500
          },
          {
            "_id": "60d21b4667d0d8992e610c91",
            "transportMode": "Ship",
            "originCountry": "USA",
            "destinationCountry": "UK",
            "originGateway": "Los Angeles",
            "destinationGateway": "London",
            "transportEmission": 47.3,
            "transportDistance": 8900
          }
        ]
      },
      {
        "_id": "60d21b4667d0d8992e610c92",
        "productID": "60d21b4667d0d8992e610c87",
        "packagingWeight": 0.8,
        "palletWeight": 3,
        "totalTransportationEmission": 85.2,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c93",
            "transportMode": "Air",
            "originCountry": "Germany",
            "destinationCountry": "USA",
            "originGateway": "Frankfurt",
            "destinationGateway": "New York",
            "transportEmission": 85.2,
            "transportDistance": 6300
          }
        ]
      }
    ],
    "createdDate": "2023-01-01T00:00:00.000Z",
    "modifiedDate": "2023-01-01T00:00:00.000Z"
  },
  "message": "Project-Product mapping created successfully"
}
```

#### Get All Project-Product Mappings
```bash
curl -X GET http://localhost:5009/api/project-product-mapping \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c88",
      "projectID": "60d21b4667d0d8992e610c85",
      "products": [
        {
          "_id": "60d21b4667d0d8992e610c89",
          "productID": "60d21b4667d0d8992e610c86",
          "packagingWeight": 1.5,
          "palletWeight": 5,
          "totalTransportationEmission": 125.6,
          "transportationLegs": [
            {
              "_id": "60d21b4667d0d8992e610c90",
              "transportMode": "Truck",
              "originCountry": "China",
              "destinationCountry": "India",
              "originGateway": "Shanghai",
              "destinationGateway": "Mumbai",
              "transportEmission": 78.3,
              "transportDistance": 4500
            },
            {
              "_id": "60d21b4667d0d8992e610c91",
              "transportMode": "Ship",
              "originCountry": "USA",
              "destinationCountry": "UK",
              "originGateway": "Los Angeles",
              "destinationGateway": "London",
              "transportEmission": 47.3,
              "transportDistance": 8900
            }
          ]
        }
      ],
      "createdDate": "2023-01-01T00:00:00.000Z",
      "modifiedDate": "2023-01-15T00:00:00.000Z"
    }
  ]
}
```

#### Get Project-Product Mapping by ID
```bash
curl -X GET http://localhost:5009/api/project-product-mapping/60d21b4667d0d8992e610c88 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Get Project-Product Mappings by Project ID
```bash
curl -X GET http://localhost:5009/api/project-product-mapping/project/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Get Project-Product Mappings by Product ID
```bash
curl -X GET http://localhost:5009/api/project-product-mapping/product/60d21b4667d0d8992e610c86 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Update Project-Product Mapping
```bash
curl -X PUT http://localhost:5009/api/project-product-mapping/60d21b4667d0d8992e610c88 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "products": [
      {
        "productID": "60d21b4667d0d8992e610c86",
        "packagingWeight": 2.0,
        "palletWeight": 6,
        "totalTransportationEmission": 130.5,
        "transportationLegs": [
          {
            "transportMode": "Truck",
            "originCountry": "China",
            "destinationCountry": "India",
            "originGateway": "Shanghai",
            "destinationGateway": "Mumbai",
            "transportEmission": 80.1,
            "transportDistance": 4500
          },
          {
            "transportMode": "Ship",
            "originCountry": "USA",
            "destinationCountry": "UK",
            "originGateway": "Los Angeles",
            "destinationGateway": "London",
            "transportEmission": 50.4,
            "transportDistance": 8900
          }
        ]
      }
    ]
  }'
```

#### Add Product to Existing Project Mapping
```bash
curl -X POST http://localhost:5009/api/project-product-mapping/60d21b4667d0d8992e610c88/product \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "productID": "60d21b4667d0d8992e610c89",
    "packagingWeight": 1.2,
    "palletWeight": 4.5,
    "totalTransportationEmission": 92.7,
    "transportationLegs": [
      {
        "transportMode": "Train",
        "originCountry": "France",
        "destinationCountry": "Germany",
        "originGateway": "Paris",
        "destinationGateway": "Berlin",
        "transportEmission": 45.3,
        "transportDistance": 1050
      },
      {
        "transportMode": "Truck",
        "originCountry": "Germany",
        "destinationCountry": "Poland",
        "originGateway": "Berlin",
        "destinationGateway": "Warsaw",
        "transportEmission": 47.4,
        "transportDistance": 575
      }
    ]
  }'
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "productID": "60d21b4667d0d8992e610c86",
        "packagingWeight": 1.5,
        "palletWeight": 5,
        "totalTransportationEmission": 125.6,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c90",
            "transportMode": "Truck",
            "originCountry": "China",
            "destinationCountry": "India",
            "originGateway": "Shanghai",
            "destinationGateway": "Mumbai",
            "transportEmission": 78.3,
            "transportDistance": 4500
          },
          {
            "_id": "60d21b4667d0d8992e610c91",
            "transportMode": "Ship",
            "originCountry": "USA",
            "destinationCountry": "UK",
            "originGateway": "Los Angeles",
            "destinationGateway": "London",
            "transportEmission": 47.3,
            "transportDistance": 8900
          }
        ]
      },
      {
        "_id": "60d21b4667d0d8992e610c94",
        "productID": "60d21b4667d0d8992e610c89",
        "packagingWeight": 1.2,
        "palletWeight": 4.5,
        "totalTransportationEmission": 92.7,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c95",
            "transportMode": "Train",
            "originCountry": "France",
            "destinationCountry": "Germany",
            "originGateway": "Paris",
            "destinationGateway": "Berlin",
            "transportEmission": 45.3,
            "transportDistance": 1050
          },
          {
            "_id": "60d21b4667d0d8992e610c96",
            "transportMode": "Truck",
            "originCountry": "Germany",
            "destinationCountry": "Poland",
            "originGateway": "Berlin",
            "destinationGateway": "Warsaw",
            "transportEmission": 47.4,
            "transportDistance": 575
          }
        ]
      }
    ],
    "createdDate": "2023-01-01T00:00:00.000Z",
    "modifiedDate": "2023-01-10T00:00:00.000Z"
  },
  "message": "Product added to project successfully"
}
```

#### Remove Product from Project Mapping
```bash
curl -X DELETE http://localhost:5009/api/project-product-mapping/60d21b4667d0d8992e610c88/product/60d21b4667d0d8992e610c89 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "productID": "60d21b4667d0d8992e610c86",
        "packagingWeight": 1.5,
        "palletWeight": 5,
        "totalTransportationEmission": 125.6,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c90",
            "transportMode": "Truck",
            "originCountry": "China",
            "destinationCountry": "India",
            "originGateway": "Shanghai",
            "destinationGateway": "Mumbai",
            "transportEmission": 78.3,
            "transportDistance": 4500
          },
          {
            "_id": "60d21b4667d0d8992e610c91",
            "transportMode": "Ship",
            "originCountry": "USA",
            "destinationCountry": "UK",
            "originGateway": "Los Angeles",
            "destinationGateway": "London",
            "transportEmission": 47.3,
            "transportDistance": 8900
          }
        ]
      }
    ],
    "createdDate": "2023-01-01T00:00:00.000Z",
    "modifiedDate": "2023-01-15T00:00:00.000Z"
  },
  "message": "Product removed from project successfully"
}
```

#### Delete Project-Product Mapping
```bash
curl -X DELETE http://localhost:5009/api/project-product-mapping/60d21b4667d0d8992e610c88 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Delete All Project-Product Mappings for a Project
```bash
curl -X DELETE http://localhost:5009/api/project-product-mapping/project/60d21b4667d0d8992e610c85 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

#### Add Product Directly to a Project by Project ID
```bash
curl -X POST http://localhost:5009/api/project-product-mapping/project/60d21b4667d0d8992e610c85/product \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "productID": "60d21b4667d0d8992e610c89",
    "packagingWeight": 1.2,
    "palletWeight": 4.5,
    "totalTransportationEmission": 92.7,
    "transportationLegs": [
      {
        "transportMode": "Train",
        "originCountry": "France",
        "destinationCountry": "Germany",
        "originGateway": "Paris",
        "destinationGateway": "Berlin",
        "transportEmission": 45.3,
        "transportDistance": 1050
      },
      {
        "transportMode": "Truck",
        "originCountry": "Germany",
        "destinationCountry": "Poland",
        "originGateway": "Berlin",
        "destinationGateway": "Warsaw",
        "transportEmission": 47.4,
        "transportDistance": 575
      }
    ]
  }'
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [
      {
        "_id": "60d21b4667d0d8992e610c94",
        "productID": "60d21b4667d0d8992e610c89",
        "packagingWeight": 1.2,
        "palletWeight": 4.5,
        "totalTransportationEmission": 92.7,
        "transportationLegs": [
          {
            "_id": "60d21b4667d0d8992e610c95",
            "transportMode": "Train",
            "originCountry": "France",
            "destinationCountry": "Germany",
            "originGateway": "Paris",
            "destinationGateway": "Berlin",
            "transportEmission": 45.3,
            "transportDistance": 1050
          },
          {
            "_id": "60d21b4667d0d8992e610c96",
            "transportMode": "Truck",
            "originCountry": "Germany",
            "destinationCountry": "Poland",
            "originGateway": "Berlin",
            "destinationGateway": "Warsaw",
            "transportEmission": 47.4,
            "transportDistance": 575
          }
        ]
      }
    ],
    "createdDate": "2023-01-01T00:00:00.000Z",
    "modifiedDate": "2023-01-10T00:00:00.000Z"
  },
  "message": "Product added to project successfully"
}
```

#### Remove Product Directly from a Project by Project ID
```bash
curl -X DELETE http://localhost:5009/api/project-product-mapping/project/60d21b4667d0d8992e610c85/product/60d21b4667d0d8992e610c89 \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1"
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "projectID": "60d21b4667d0d8992e610c85",
    "products": [],
    "createdDate": "2023-01-01T00:00:00.000Z",
    "modifiedDate": "2023-01-15T00:00:00.000Z"
  },
  "message": "Product removed from project successfully"
}
```

### Calculation Endpoints

#### Classify a Product
```bash
curl -X POST http://localhost:5009/api/classify-product \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "productName": "LED Television",
    "productDescription": "55 inch 4K Ultra HD Smart LED TV"
  }'
```

#### Classify a Bill of Materials
```bash
curl -X POST http://localhost:5009/api/classify-bom \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "bomItems": [
      {
        "name": "Aluminum frame",
        "description": "Lightweight aluminum enclosure",
        "weight": 2.5
      },
      {
        "name": "LED panel",
        "description": "LCD display with LED backlight",
        "weight": 5.2
      }
    ]
  }'
```

#### Classify Manufacturing Processes
```bash
curl -X POST http://localhost:5009/api/classify-manufacturing-process \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "material": "Aluminum",
    "description": "CNC machining of aluminum housing"
  }'
```

#### Calculate Distance Between Locations
```bash
curl -X POST http://localhost:5009/api/distance \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "origin": "New York, USA",
    "destination": "London, UK",
    "mode": "air"
  }'
```

#### Calculate Transport Emissions
```bash
curl -X POST http://localhost:5009/api/calculate-transport-emission \
  -H "Content-Type: application/json" \
  -H "x-iviva-account: lucy1" \
  -d '{
    "weight": 1000,
    "distance": 5000,
    "mode": "sea",
    "productType": "electronics"
  }'
```