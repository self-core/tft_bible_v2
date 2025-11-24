# Testing Plan for TFT Bible v2 New Features

## Set 16 Data Integration and Import/Export Functionality

### Backend Tests

#### 1. Database Integration Tests
- [ ] Verify that the seed data function properly creates Set 16 data in MongoDB
- [ ] Test that all Set 16 entities (champions, items, traits, augments) are correctly stored
- [ ] Verify trait breakpoints and scaling work correctly
- [ ] Test that champion stats and abilities are properly stored

#### 2. Import/Export Functionality Tests
- [ ] Test export_composition endpoint to verify it returns a valid encoded string
- [ ] Test import_composition endpoint with valid import string
- [ ] Test import_composition endpoint with invalid import string (should return error)
- [ ] Test that imported composition has correct values and proper structure
- [ ] Verify error handling for malformed Base64 strings
- [ ] Verify error handling for invalid JSON in import string

#### 3. API Endpoint Tests
- [ ] Verify `/api/v1/compositions/{id}/export` endpoint works correctly
- [ ] Verify `/api/v1/compositions/import` endpoint works correctly
- [ ] Test all existing composition endpoints still work after new functionality added

#### 4. Custom Builder Integration Tests
- [ ] Verify compositions created in custom builder can be properly exported
- [ ] Verify imported compositions display correctly in the custom builder
- [ ] Test composition validation on import

### Frontend Tests

#### 1. Custom Builder UI Tests
- [ ] Verify the custom builder page loads correctly from navigation
- [ ] Test champion selection and placement on board
- [ ] Test champion removal from board
- [ ] Test champion placement on bench
- [ ] Test champion removal from bench
- [ ] Verify set selection works properly
- [ ] Test trait calculation based on champion placement
- [ ] Verify board reset functionality

#### 2. Import/Export UI Tests
- [ ] Test export composition functionality from custom builder
- [ ] Verify export modal shows up with encoded string
- [ ] Test copy to clipboard functionality
- [ ] Test import composition functionality
- [ ] Verify import modal shows up with input field
- [ ] Test successful import of valid composition data
- [ ] Test error handling for invalid import string
- [ ] Verify imported composition is correctly displayed on the board

#### 3. Navigation Tests
- [ ] Verify "Custom Builder" link appears in navigation menu
- [ ] Test navigation to custom builder page
- [ ] Verify all other navigation links still work

### Integration Tests

#### 1. End-to-End Tests
- [ ] Create a composition in the custom builder
- [ ] Export the composition to get an export string
- [ ] Clear the board
- [ ] Import the same composition using the export string
- [ ] Verify the imported composition matches the original

#### 2. Cross-Feature Tests
- [ ] Test that exported compositions can be saved to the database (when DB integration is complete)
- [ ] Verify that imported compositions can be modified in the builder
- [ ] Test trait calculations work correctly after import/export

### Performance Tests

#### 1. Load Tests
- [ ] Verify import/export functions perform well with larger compositions
- [ ] Test memory usage during import/export operations
- [ ] Verify UI responsiveness during import/export operations

### Security Tests

#### 1. Input Validation
- [ ] Test import with malicious JSON content
- [ ] Test import with extremely large import strings
- [ ] Verify proper validation of Base64 encoded data

### Compatibility Tests

#### 1. Browser Compatibility
- [ ] Test import/export functionality works across different browsers
- [ ] Verify clipboard functionality works in all supported browsers
- [ ] Test responsive design for import/export modals

## Specific Test Cases

### Test Case 1: Basic Import/Export Functionality
1. Create a composition in Custom Builder
2. Click "Export" button
3. Verify export modal appears with valid string
4. Copy the export string
5. Navigate to import modal
6. Paste the export string
7. Import the composition
8. Verify the board displays the same composition

### Test Case 2: Set 16 Champion Selection
1. Navigate to Custom Builder
2. Select Set 16 from dropdown
3. Verify correct champions appear in champion picker
4. Verify champion stats are appropriate for Set 16

### Test Case 3: Trait Calculation
1. Place champions with known traits on the board
2. Verify the "Active Traits" panel shows correct trait counts
3. Verify trait thresholds are calculated correctly

### Test Case 4: Error Handling
1. Try importing with empty string
2. Verify appropriate error message appears
3. Try importing with invalid Base64 string
4. Verify appropriate error message appears

## Test Environment Setup
- [ ] Ensure MongoDB is running and accessible
- [ ] Run backend server with proper environment variables
- [ ] Run frontend application
- [ ] Ensure all API endpoints are properly connected