---
name: Merge Drivers List and Payout Requests into Unified Endpoint
overview: Combine the `admin-drivers-list` and `admin-payout-requests-list` Supabase Edge Functions into a single unified endpoint (`admin-list`) that accepts a `type` parameter to return either drivers or payout requests, optimizing Supabase space while maintaining all existing functionality.
todos:
  - id: update-driver-service
    content: Update fetchDriversList() in driverService.js to call admin-list?type=drivers
    status: pending
  - id: update-financial-service
    content: Update fetchPayoutRequests() in financialService.js to call admin-list?type=payout-requests
    status: pending
  - id: add-apikey-headers
    content: Ensure both updated functions include apikey header like other functions
    status: pending
    dependencies:
      - update-driver-service
      - update-financial-service
  - id: test-drivers-functionality
    content: Verify drivers list still works correctly with new endpoint
    status: pending
    dependencies:
      - update-driver-service
  - id: test-payout-functionality
    content: Verify payout requests still work correctly with new endpoint
    status: pending
    dependencies:
      - update-financial-service
---

# Merge Drivers List and Payout Requests into Unified Endpoint

## Goal

Combine two separate Supabase Edge Functions into one to optimize space usage while maintaining all existing functionality.

## Current State

- **Frontend:** Two separate service functions calling different endpoints
- `fetchDriversList()` → calls `admin-drivers-list`
- `fetchPayoutRequests()` → calls `admin-payout-requests-list`
- **Backend:** Two separate Supabase Edge Functions
- `admin-drivers-list` - returns drivers with search/status filters
- `admin-payout-requests-list` - returns payout requests with status filter

## Proposed Solution

### New Unified Endpoint: `admin-list`

- Accepts a `type` query parameter: `drivers` or `payout-requests`
- Returns the appropriate data based on the type
- Maintains all existing query parameters for each type

### Implementation Plan

#### Backend (Supabase Edge Function)

Create a new function `admin-list` that:

1. Accepts query parameters:

- `type` (required): `"drivers"` or `"payout-requests"`
- For drivers: `search`, `status`
- For payout-requests: `status`

2. Routes to appropriate logic based on `type`
3. Returns data in the same format as the original functions

#### Frontend Changes

1. **Update `driverService.js`:**

- Modify `fetchDriversList()` to call `admin-list?type=drivers` instead of `admin-drivers-list`
- Keep the same function signature and return format

2. **Update `financialService.js`:**

- Modify `fetchPayoutRequests()` to call `admin-list?type=payout-requests` instead of `admin-payout-requests-list`
- Keep the same function signature and return format

3. **No view changes needed** - The service layer abstraction means views continue working without modification

## Files to Modify

### Frontend Files:

- `src/services/driverService.js` - Update `fetchDriversList()` function
- `src/services/financialService.js` - Update `fetchPayoutRequests()` function

### Backend (Instructions Provided):

- Create new Supabase Edge Function: `admin-list`
- Can eventually delete: `admin-drivers-list` and `admin-payout-requests-list` (after migration)

## Benefits

- Reduces Supabase Edge Function count by 1
- Maintains backward compatibility at the frontend service layer
- No changes needed in view components
- Same curl command structure (just different endpoint name)

## Migration Strategy

1. Create new `admin-list` function in Supabase
2. Update frontend to call new endpoint
3. Test both drivers and payout requests functionality
4. Once verified, delete old functions to free space