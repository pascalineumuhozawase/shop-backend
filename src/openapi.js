const errorResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
  },
  required: ['message'],
}

const success = (schema) => ({ type: 'object', properties: { data: schema }, required: ['data'] })
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
const productIdParam = { name: 'productId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
const pageParameters = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 } },
]
const pagedItems = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: true } },
    total: { type: 'integer' }, page: { type: 'integer' }, pages: { type: 'integer' },
  },
  required: ['items', 'total', 'page', 'pages'],
}
const product = {
  type: 'object',
  properties: {
    id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string' },
    price: { type: 'number', format: 'double' }, stock: { type: 'integer' }, image: { type: 'string', nullable: true },
    rating: { type: 'number' }, popularity: { type: 'integer' }, isNew: { type: 'boolean' },
    isFeatured: { type: 'boolean' }, categoryId: { type: 'integer' }, category: { type: 'string' },
  },
  required: ['id', 'name', 'price', 'stock', 'category'],
}
const category = {
  type: 'object', properties: {
    id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' },
    description: { type: 'string', nullable: true }, isActive: { type: 'boolean' },
  }, required: ['id', 'name', 'slug'],
}
const user = {
  type: 'object', properties: {
    id: { type: 'integer' }, firstName: { type: 'string' }, lastName: { type: 'string' },
    email: { type: 'string', format: 'email' }, phone: { type: 'string', nullable: true },
    role: { type: 'string', enum: ['customer', 'admin'] }, createdAt: { type: 'string', format: 'date-time' },
  }, required: ['id', 'firstName', 'lastName', 'email', 'role'],
}
const order = {
  type: 'object', properties: {
    id: { type: 'integer' }, userId: { type: 'integer', nullable: true }, customerName: { type: 'string' },
    email: { type: 'string', format: 'email' }, phone: { type: 'string' }, address: { type: 'string' },
    city: { type: 'string' }, region: { type: 'string', nullable: true }, postalCode: { type: 'string', nullable: true },
    country: { type: 'string' }, subtotal: { type: 'number' }, shippingFee: { type: 'number' }, total: { type: 'number' },
    paymentMethod: { type: 'string', enum: ['cod', 'mock'] }, paymentStatus: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
    createdAt: { type: 'string', format: 'date-time' }, items: { type: 'array', items: { type: 'object', additionalProperties: true } },
  }, required: ['id', 'subtotal', 'shippingFee', 'total', 'paymentMethod', 'status', 'items'],
}
const jsonBody = (schema, required = true) => ({ required, content: { 'application/json': { schema } } })
const jsonResponse = (description, schema) => ({ description, content: { 'application/json': { schema } } })
const auth = [{ bearerAuth: [] }]
const admin = [{ bearerAuth: [] }]
const pathItem = (summary, tags, responses, extra = {}) => ({ summary, tags, responses, ...extra })
const successResponse = (schema, description = 'Successful response') => ({ 200: jsonResponse(description, success(schema)), 400: jsonResponse('Invalid request', errorResponse), 401: jsonResponse('Authentication required or token invalid', errorResponse) })

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Online Shopping API', version: '1.0.0',
    description: 'REST API for the Common Goods storefront. Amounts are calculated by the server. Mock payment is a simulation only and does not process real payments.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local API' }],
  tags: [
    { name: 'Health' }, { name: 'Authentication' }, { name: 'Profile' }, { name: 'Products' },
    { name: 'Categories' }, { name: 'Cart' }, { name: 'Orders' }, { name: 'Admin' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: errorResponse, Product: product, Category: category, User: user, Order: order, Pagination: pagedItems,
      Credentials: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 1 } } },
      Registration: { type: 'object', required: ['firstName', 'lastName', 'email', 'password'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, phone: { type: 'string' } } },
      ProfileUpdate: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string', nullable: true } }, minProperties: 1 },
      CartItemInput: { type: 'object', required: ['productId'], properties: { productId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1, maximum: 99, default: 1 } } },
      QuantityUpdate: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 } } },
      OrderInput: {
        type: 'object', required: ['customer', 'shippingAddress', 'paymentMethod', 'items'],
        properties: {
          customer: { type: 'object', required: ['firstName', 'lastName', 'email', 'phone'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' } } },
          shippingAddress: { type: 'object', required: ['address', 'city', 'country'], properties: { address: { type: 'string' }, city: { type: 'string' }, region: { type: 'string' }, postalCode: { type: 'string' }, country: { type: 'string' } } },
          paymentMethod: { type: 'string', enum: ['cod', 'mock', 'mock_payment'] },
          items: { type: 'array', minItems: 1, items: { type: 'object', required: ['productId', 'quantity'], properties: { productId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1, maximum: 99 } } } },
          subtotal: { type: 'number', description: 'Ignored. The server calculates all prices.' }, shippingFee: { type: 'number', description: 'Ignored. The server calculates shipping.' }, total: { type: 'number', description: 'Ignored. The server calculates the total.' },
        },
      },
      ProductInput: { type: 'object', required: ['name', 'categoryId', 'price'], properties: { name: { type: 'string' }, categoryId: { type: 'integer' }, description: { type: 'string' }, price: { type: 'number', minimum: 0 }, stock: { type: 'integer', minimum: 0 }, image: { type: 'string', format: 'uri' }, isNew: { type: 'boolean' }, isFeatured: { type: 'boolean' } } },
      CategoryInput: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' } } },
      OrderStatus: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] } } },
    },
  },
  paths: {
    '/api/health': { get: pathItem('Check API process health', ['Health'], { 200: jsonResponse('Healthy', success({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } })) }) },
    '/api/auth/register': { post: pathItem('Register a customer account', ['Authentication'], { 201: jsonResponse('Account created', success({ type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } })), 400: jsonResponse('Invalid input', errorResponse), 409: jsonResponse('Email already registered', errorResponse) }, { requestBody: jsonBody({ $ref: '#/components/schemas/Registration' }) }) },
    '/api/auth/login': { post: pathItem('Sign in', ['Authentication'], { 200: jsonResponse('Signed in', success({ type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } })), 400: jsonResponse('Invalid input', errorResponse), 401: jsonResponse('Invalid credentials', errorResponse) }, { requestBody: jsonBody({ $ref: '#/components/schemas/Credentials' }) }) },
    '/api/auth/me': { get: pathItem('Get current account', ['Authentication'], successResponse({ type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } }), { security: auth }) },
    '/api/auth/logout': { post: pathItem('Acknowledge logout (client discards the stateless JWT)', ['Authentication'], successResponse({ type: 'object', properties: { loggedOut: { type: 'boolean' } } }), { security: auth }) },
    '/api/auth/profile': { patch: pathItem('Update profile', ['Profile'], successResponse({ $ref: '#/components/schemas/User' }), { security: auth, requestBody: jsonBody({ $ref: '#/components/schemas/ProfileUpdate' }) }) },
    '/api/users/me': { patch: pathItem('Update profile (storefront endpoint)', ['Profile'], successResponse({ $ref: '#/components/schemas/User' }), { security: auth, requestBody: jsonBody({ $ref: '#/components/schemas/ProfileUpdate' }) }) },
    '/api/products': { get: pathItem('Search and filter active products', ['Products'], successResponse({ $ref: '#/components/schemas/Pagination' }), { parameters: [
      ...pageParameters,
      { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'category', in: 'query', description: 'Category id, slug, or case-insensitive name', schema: { type: 'string' } },
      { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } }, { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
      { name: 'inStock', in: 'query', schema: { type: 'boolean' } }, { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price-asc', 'price-desc', 'newest', 'popular'] } },
      { name: 'featured', in: 'query', schema: { type: 'boolean' } },
    ] }) },
    '/api/products/{id}': { get: pathItem('Get product details', ['Products'], successResponse({ $ref: '#/components/schemas/Product' }), { parameters: [idParam], responses: { 200: jsonResponse('Product found', success({ $ref: '#/components/schemas/Product' })), 404: jsonResponse('Product not found', errorResponse) } }) },
    '/api/categories': { get: pathItem('List active categories', ['Categories'], successResponse({ type: 'array', items: { $ref: '#/components/schemas/Category' } })) },
    '/api/cart': {
      get: pathItem('Get account cart', ['Cart'], successResponse({ type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' }, quantity: { type: 'integer' } } } } } }), { security: auth }),
      delete: pathItem('Clear account cart', ['Cart'], successResponse({ type: 'object', properties: { cleared: { type: 'boolean' } } }), { security: auth }),
    },
    '/api/cart/items': { post: pathItem('Add a product to cart', ['Cart'], { 201: jsonResponse('Item added', success({ type: 'object', properties: { productId: { type: 'integer' }, quantity: { type: 'integer' } } })), 400: jsonResponse('Invalid quantity', errorResponse), 401: jsonResponse('Authentication required', errorResponse), 404: jsonResponse('Product not found', errorResponse), 409: jsonResponse('Insufficient stock', errorResponse) }, { security: auth, requestBody: jsonBody({ $ref: '#/components/schemas/CartItemInput' }) }) },
    '/api/cart/items/{productId}': {
      patch: pathItem('Set cart item quantity', ['Cart'], { 200: jsonResponse('Quantity updated', success({ type: 'object', properties: { productId: { type: 'integer' }, quantity: { type: 'integer' } } })), 400: jsonResponse('Invalid quantity', errorResponse), 401: jsonResponse('Authentication required', errorResponse), 404: jsonResponse('Item not in cart', errorResponse), 409: jsonResponse('Insufficient stock', errorResponse) }, { security: auth, parameters: [productIdParam], requestBody: jsonBody({ $ref: '#/components/schemas/QuantityUpdate' }) }),
      delete: pathItem('Remove item from cart', ['Cart'], successResponse({ type: 'object', properties: { removed: { type: 'boolean' } } }), { security: auth, parameters: [productIdParam] }),
    },
    '/api/orders': { post: pathItem('Place COD or mock-payment order; totals are recalculated and stock is updated transactionally', ['Orders'], { 201: jsonResponse('Order created', success({ type: 'object', properties: { order: { $ref: '#/components/schemas/Order' } } })), 400: jsonResponse('Invalid order', errorResponse), 401: jsonResponse('Invalid provided token', errorResponse), 409: jsonResponse('Insufficient stock', errorResponse) }, { security: [{ bearerAuth: [] }, {}], requestBody: jsonBody({ $ref: '#/components/schemas/OrderInput' }) }) },
    '/api/orders/me': { get: pathItem('List current account orders', ['Orders'], successResponse({ type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } }), { security: auth }) },
    '/api/orders/{id}': { get: pathItem('Get own order details (administrators may view any order)', ['Orders'], { 200: jsonResponse('Order found', success({ type: 'object', properties: { order: { $ref: '#/components/schemas/Order' } } })), 401: jsonResponse('Authentication required', errorResponse), 404: jsonResponse('Order not found', errorResponse) }, { security: auth, parameters: [idParam] }) },
    '/api/admin/stats': { get: pathItem('Get store dashboard metrics', ['Admin'], successResponse({ type: 'object', properties: { products: { type: 'integer' }, orders: { type: 'integer' }, customers: { type: 'integer' }, revenue: { type: 'number' } } }), { security: admin }) },
    '/api/admin/products': {
      get: pathItem('List and search all products', ['Admin'], successResponse({ $ref: '#/components/schemas/Pagination' }), { security: admin, parameters: [...pageParameters, { name: 'search', in: 'query', schema: { type: 'string' } }] }),
      post: pathItem('Create product', ['Admin'], { 201: jsonResponse('Product created', success({ $ref: '#/components/schemas/Product' })), 400: jsonResponse('Invalid product', errorResponse), 401: jsonResponse('Authentication required', errorResponse), 403: jsonResponse('Admin access required', errorResponse) }, { security: admin, requestBody: jsonBody({ $ref: '#/components/schemas/ProductInput' }) }),
    },
    '/api/admin/products/{id}': {
      patch: pathItem('Update product fields', ['Admin'], successResponse({ $ref: '#/components/schemas/Product' }), { security: admin, parameters: [idParam], requestBody: jsonBody({ $ref: '#/components/schemas/ProductInput' }, false) }),
      delete: pathItem('Soft-delete product', ['Admin'], successResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }), { security: admin, parameters: [idParam] }),
    },
    '/api/admin/products/images': { post: pathItem('Upload product image (JPEG/PNG/WebP/GIF, max 5 MB)', ['Admin'], { 201: jsonResponse('Image uploaded', success({ type: 'object', properties: { imageUrl: { type: 'string', format: 'uri' } } })), 400: jsonResponse('Invalid or missing image', errorResponse), 401: jsonResponse('Authentication required', errorResponse), 403: jsonResponse('Admin access required', errorResponse) }, { security: admin, requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } } } } }) },
    '/api/admin/categories': {
      get: pathItem('List categories including inactive categories', ['Admin'], successResponse({ type: 'array', items: { $ref: '#/components/schemas/Category' } }), { security: admin }),
      post: pathItem('Create category', ['Admin'], { 201: jsonResponse('Category created', success({ $ref: '#/components/schemas/Category' })), 400: jsonResponse('Invalid category', errorResponse), 409: jsonResponse('Category already exists', errorResponse) }, { security: admin, requestBody: jsonBody({ $ref: '#/components/schemas/CategoryInput' }) }),
    },
    '/api/admin/categories/{id}': {
      patch: pathItem('Update category fields', ['Admin'], successResponse({ $ref: '#/components/schemas/Category' }), { security: admin, parameters: [idParam], requestBody: jsonBody({ type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' } } }) }),
      delete: pathItem('Soft-delete category', ['Admin'], successResponse({ type: 'object', properties: { deleted: { type: 'boolean' } } }), { security: admin, parameters: [idParam] }),
    },
    '/api/admin/orders': { get: pathItem('Search and filter orders', ['Admin'], successResponse({ $ref: '#/components/schemas/Pagination' }), { security: admin, parameters: [...pageParameters, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] } }] }) },
    '/api/admin/orders/{id}': { patch: pathItem('Change order status; cancellation restores stock once', ['Admin'], successResponse({ $ref: '#/components/schemas/Order' }), { security: admin, parameters: [idParam], requestBody: jsonBody({ $ref: '#/components/schemas/OrderStatus' }) }) },
    '/api/admin/customers': { get: pathItem('Search customer directory', ['Admin'], successResponse({ $ref: '#/components/schemas/Pagination' }), { security: admin, parameters: [...pageParameters, { name: 'search', in: 'query', schema: { type: 'string' } }] }) },
  },
}

export default spec
