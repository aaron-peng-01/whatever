# Delivery Platform Blueprint

This playbook documents the real deployment of the Wowok-based food delivery platform. It applies the exact objects, addresses, and Guards already live in the project so you can clone or extend the system safely.

## 🔁 Build Sequence (permission → repository → treasury → guard → machine → service → arbitration)

Because many Wowok objects become immutable after being referenced, **stick to this order**:

1. **Permission** – define all custom permission indexes up front so every other object can reference them.
2. **Repository** – declare strict-mode policies while the Permission address is known; changing later requires a new Repository.
3. **Treasury** – services and Guards reference the payout pool; create it before anything binds to it.
4. **Guards** – publish buy/merchant/rider/withdraw Guards once Permission/Treasury exist.
5. **Machine** – clone/edit while unpublished, wire in Guard addresses, then publish.
6. **Service** – bind Machine, Guards, and Treasury. Publishing freezes those references.
7. **Arbitration** – attach the dispute board and fee treasury after the Service address is finalized.

Following this chain prevents “object already referenced/cannot modify” errors when cloning or iterating.

## Object Stack Overview

- **Permission** – `0x1b9aa15eed0ec9b5b758e99e617b98b7c1980359cfa55fbb3d4a41f55f096c1a` (custom permissions 1120–1123)
- **Repository** – `0x61f69895ef61f66c1cfe3d084c99bd998fa534a916a70196b9a987a64254c8cb` (`customer_verification`, `order_ready_snapshot`, `rider_geolocation`, `order_reputation_record`)
- **Treasury** – `0xa6125d86b5b3942eea910b37f39aacf38de69e25c904df5dd94f5dbf033e6a9e` (service payout pool)
- **Guards**
  - `guard_customer_verified` `0x293067d684255c6160e3e694642d0ee65f07dacd70fa4bcdf10578b75285f06d`
  - `guard_merchant_operator` `0x7af32a011e6143ec8f1cb7e217ce273fdbaa5e28f07a2848c82a338f3aefaab9`
  - `guard_rider_operator` `0xa4a71161fdc3fa97410a5054f6117e0606b4d44efe8cf5ee8a0e0521e26f4c4e`
  - `guard_reputation_withdraw` `0x7728cd21fe6cb10c3e07007eb764352c338025246157b1ec3da37baf65a6932a`
- **Machine** – `0xead0adee3fa674fc145de4f3651f253436707b8c339e4229f128c114ef3ca7be` (guarded workflow, published)
- **Service** – `0x17e18c19a1f5d34801958a7125581727fb40bdde6684ee9eb412498c89a5b699` (“Food Menu” storefront)
- **Arbitration** – `0xd5e45309884956bf9425a75485f142c8c6a06452d7efae4e8e35b2d49a96468d` with fee treasury `0x9f1f1199a4d6739c6351d25d60d07fafc511a6403b25c08591605d73c3b197c8`

---

## 1. Permission Foundation

The permission layer keeps every later object under a single governance umbrella. It defines the custom indices used by Repository policies and grants the admin address the ability to operate guards, machines, and treasuries. Clone this whenever you roll out a new city and simply swap the admin address.

```json
// Agent Prompt 1: Create the foundational permission object for delivery platform governance
// This establishes custom permission indices (1120-1123) for customer verification, order reputation, 
// merchant operations, and rider geolocation tracking across the entire delivery ecosystem
// Replace {ADMIN} with your actual admin address before executing
{
  "account": "{ADMIN}",
  "data": {
    "object": {
      "name": "delivery_reputation_permission",
      "onChain": true,
      "tags": ["delivery","permission"]
    },
    "description": "Unified governance for merchants, couriers, arbitration",
    "biz_permission": {
      "op": "add",
      "data": [
        { "index": 1120, "name": "customer_verification_write" },
        { "index": 1121, "name": "order_reputation_record_write" },
        { "index": 1122, "name": "order_ready_snapshot_write" },
        { "index": 1123, "name": "rider_geolocation_write" }
      ]
    },
    "admin": {
      "op": "add",
      "addresses": [
        { "name_or_address": "{ADMIN}", "local_mark_first": false }
      ]
    },
    "permission": {
      "op": "add entity",
      "entities": [
        {
          "address": { "name_or_address": "{ADMIN}" },
          "permissions": [
            { "index": 1120 }, { "index": 1121 },
            { "index": 1122 }, { "index": 1123 }
          ]
        }
      ]
    }
  }
}
```

---

## 2. Repository (Strict Mode)

This repository acts as the evidence vault. Each field lines up with a specific business event—buyer vetting, merchant prep proof, courier status, or final reputation summary. Because the repository runs in strict mode, only addresses with the correct permission index can write to each field.

```json
// Agent Prompt 2: Initialize the evidence repository for delivery platform data integrity
// Creates strict-mode data policies for customer verification, order snapshots, rider tracking,
// and reputation records with proper permission-based access control
// Replace {ADMIN} and {PERMISSION_ADDRESS} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": {
      "name": "delivery_reputation_repository",
      "permission": "{PERMISSION_ADDRESS}",
      "onChain": true,
      "tags": ["delivery","reputation"]
    },
    "mode": 1,
    "description": "Reputation + evidence records",
    "policy": {
      "op": "add",
      "data": [
        { "key": "customer_verification", "description": "Buyer status", "dataType": 204, "permissionIndex": 1120 },
        { "key": "order_ready_snapshot", "description": "Merchant prep proof", "dataType": 204, "permissionIndex": 1122 },
        { "key": "rider_geolocation", "description": "Courier location/status", "dataType": 204, "permissionIndex": 1123 },
        { "key": "order_reputation_record", "description": "Per-order summary", "dataType": 204, "permissionIndex": 1121 }
      ]
    }
  }
}
```

---

## 3. Treasury Configuration

Create the payout pool once and reuse it across services. The treasury inherits the same permission object so that only approved operators can deposit/withdraw funds from the delivery business.

```json
// Agent Prompt 3: Establish the treasury for delivery platform financial operations
// Creates the central payout pool that manages all delivery-related transactions,
// incentives, and withdrawals with proper permission controls
// Replace {ADMIN} and {PERMISSION_ADDRESS} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": {
      "type_parameter": "0x2::sui::SUI",
      "name": "delivery_reputation_treasury",
      "permission": "{PERMISSION_ADDRESS}",
      "onChain": true,
      "tags": ["delivery","treasury"]
    },
    "description": "Food delivery payouts and incentives"
  }
}
```

---

## 4. Guard Suite

### 4.1 Buyer Guard (`guard_customer_verified`)

White-listing keeps fake buyers out of the workflow. This guard checks whether the transaction signer is either the designated customer account or the admin (useful for dry runs and emergency overrides).

```json
// Agent Prompt 4: Create customer verification guard for buyer access control
// Implements whitelist-based authentication allowing only verified customers
// and admin to interact with order placement and confirmation processes
// Replace {ADMIN} and {USR} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "description": "Whitelist buyers/admin for confirmation and reviews",
    "namedNew": {
      "name": "guard_customer_verified",
      "onChain": true,
      "tags": ["buy_guard","delivery"]
    },
    "root": {
      "logic": 20,
      "parameters": [
        {
          "logic": 16,
          "parameters": [
            { "context": 60 },
            { "value": "{USR}", "value_type": 101 }
          ]
        },
        {
          "logic": 16,
          "parameters": [
            { "context": 60 },
            { "value": "{ADMIN}", "value_type": 101 }
          ]
        }
      ]
    }
  }
}
```

### 4.2 Merchant Guard (`guard_merchant_operator`)

Every merchant-only node—accepting orders, confirming prep, posting merchant reviews—uses this guard. If someone tries to spoof the merchant, the forward fails and the workflow remains at the previous node.

```json
// Agent Prompt 5: Deploy merchant operator guard for vendor workflow protection
// Restricts merchant-specific operations like order acceptance, preparation confirmation,
// and review posting to authorized merchant addresses only
// Replace {ADMIN} and {MERCHANT} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "description": "Merchant-only workflow nodes",
    "namedNew": {
      "name": "guard_merchant_operator",
      "onChain": true,
      "tags": ["merchant_guard"]
    },
    "root": {
      "logic": 16,
      "parameters": [
        { "context": 60 },
        { "value": "{MERCHANT}", "value_type": 101 }
      ]
    }
  }
}
```

### 4.3 Rider Guard (`guard_rider_operator`)

The rider guard protects pickup/delivery nodes. It prevents unauthorized logistics providers from hijacking the process or finishing steps without actually collecting/dropping off the order.

```json
// Agent Prompt 6: Implement rider operator guard for delivery personnel authentication
// Secures courier-specific workflow nodes including pickup, delivery confirmation,
// and location updates to prevent unauthorized logistics access
// Replace {ADMIN} and {COURIER} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "description": "Courier-only workflow nodes",
    "namedNew": {
      "name": "guard_rider_operator",
      "onChain": true,
      "tags": ["rider_guard"]
    },
    "root": {
      "logic": 16,
      "parameters": [
        { "context": 60 },
        { "value": "{COURIER}", "value_type": 101 }
      ]
    }
  }
}
```

### 4.4 Withdrawal Guard (`guard_reputation_withdraw`)

Withdrawals are delayed until an admin attests the workflow is complete (witness flag). Later you can swap this guard for one that queries the repository or progress history once the guard MPC server supports it.

```json
// Agent Prompt 7: Configure withdrawal guard for treasury fund release
// Enforces admin attestation requirement before allowing fund withdrawals,
// ensuring completion verification before financial settlements
// Replace {ADMIN} with your actual admin address
{
  "account": "{ADMIN}",
  "data": {
    "description": "Allow withdrawals after admin attests completion",
    "namedNew": {
      "name": "guard_reputation_withdraw",
      "onChain": true,
      "tags": ["withdraw_guard","delivery"]
    },
    "table": [
      { "identifier": 1, "bWitness": true, "value_type": 100 }
    ],
    "root": {
      "logic": 19,
      "parameters": [
        {
          "logic": 16,
          "parameters": [
            { "context": 60 },
            { "value": "{ADMIN}", "value_type": 101 }
          ]
        },
        {
          "logic": 16,
          "parameters": [
            { "identifier": 1 },
            { "value": true, "value_type": 100 }
          ]
        }
      ]
    }
  }
}
```

---

## 5. Machine Workflow

### 5.1 Clone Base Machine

Start from the reference workflow you already validated, then clone it so you can publish a Guard-enabled variant without touching the original. This keeps older services running while you iterate.

```json
// Agent Prompt 8: Clone the base workflow machine for guard integration
// Creates a copy of the reference workflow to enable guard-protected modifications
// while preserving the original machine for backward compatibility
// Replace {ADMIN} and {SOURCE_MACHINE} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": "{SOURCE_MACHINE}",
    "clone_new": {
      "namedNew": {
        "name": "delivery_reputation_machine_guarded",
        "onChain": true,
        "tags": ["delivery","workflow"]
      }
    }
  }
}
```

### 5.2 Replace Nodes with Guarded Forwards (excerpt)

After cloning, overwrite the nodes so that every forward references the correct guard. The excerpt below shows the pattern—reuse it for the entire workflow.

```json
// Agent Prompt 9: Configure guarded workflow nodes with role-based access
// Updates machine nodes to include guard protection for merchant acceptance,
// rider delivery, and customer confirmation steps in the delivery process
// Replace {ADMIN}, {NEW_MACHINE}, {GUARD_MERCHANT}, {GUARD_RIDER}, and {GUARD_CUSTOMER}
{
  "account": "{ADMIN}",
  "data": {
    "object": "{NEW_MACHINE}",
    "nodes": {
      "op": "add",
      "bReplace": true,
      "data": [
        {
          "name": "order_accepted",
          "pairs": [
            {
              "prior_node": "",
              "threshold": 0,
              "forwards": [
                {
                  "name": "merchant_accept_order",
                  "namedOperator": "merchant_operator",
                  "weight": 1,
                  "guard": { "guard": "{GUARD_MERCHANT}", "order_ids": [] }
                }
              ]
            }
          ]
        },
        {
          "name": "order_delivered",
          "pairs": [
            {
              "prior_node": "order_picked_up",
              "threshold": 1,
              "forwards": [
                {
                  "name": "rider_delivered",
                  "namedOperator": "rider_operator",
                  "weight": 1,
                  "guard": { "guard": "{GUARD_RIDER}", "order_ids": [] }
                }
              ]
            }
          ]
        },
        {
          "name": "confirm_receipt",
          "pairs": [
            {
              "prior_node": "order_delivered",
              "threshold": 0,
              "forwards": [
                {
                  "name": "usr_confirm",
                  "namedOperator": "usr_operation",
                  "weight": 1,
                  "guard": { "guard": "{GUARD_CUSTOMER}", "order_ids": [] }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### 5.3 Publish (keep paused if needed)

Publishing locks the Machine forever, so only do this once all guard references check out. Keep `bPaused=true` until you're ready to let services spawn new progress instances.

```json
// Agent Prompt 10: Publish the guarded workflow machine to blockchain
// Finalizes the machine configuration and makes it immutable on-chain
// Set bPaused=true initially to prevent premature usage during testing phase
// Replace {ADMIN} and {NEW_MACHINE} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": "{NEW_MACHINE}",
    "bPublished": true,
    "bPaused": true
  }
}
```

---

## 6. Service Storefront

The service brings everything together: it points to the guarded Machine, binds the Treasury, and sets the buy/withdraw guards. Publish only after you verify prices, stock, and required info.

```json
// Agent Prompt 11: Deploy the delivery service storefront with integrated guards
// Creates the main service interface connecting machine workflow, treasury payments,
// and role-based access controls for customer purchases and withdrawals
// Replace {ADMIN}, {PERMISSION_ADDRESS}, {NEW_MACHINE}, {TREASURY_ADDRESS}, 
// {GUARD_CUSTOMER}, and {GUARD_WITHDRAW} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": {
      "name": "delivery_reputation_service",
      "permission": "{PERMISSION_ADDRESS}",
      "type_parameter": "0x2::sui::SUI",
      "onChain": true,
      "tags": ["delivery","service"]
    },
    "description": "Food Menu",
    "location": "New York",
    "machine": "{NEW_MACHINE}",
    "payee_treasury": "{TREASURY_ADDRESS}",
    "buy_guard": "{GUARD_CUSTOMER}",
    "withdraw_guard": {
      "op": "set",
      "guards": [
        { "guard": "{GUARD_WITHDRAW}", "rate": 5000 }
      ]
    },
    "sales": {
      "op": "add",
      "sales": [
        { "item": "Noodles", "price": "5000000", "stock": "100" }
      ]
    },
    "bPublished": false,
    "bPaused": true
  }
}
```

---

## 7. Arbitration + Fee Treasury

Disputes reference the same evidence the workflow produces. This arbitration object shares the Permission with the rest of the stack and creates its own fee treasury so arbitrators can be compensated.

```json
// Agent Prompt 12: Establish arbitration system with fee treasury for dispute resolution
// Creates the arbitration board and dedicated fee treasury to handle delivery disputes
// and compensate arbitrators while maintaining permission consistency with the platform
// Replace {ADMIN} and {PERMISSION_ADDRESS} with your actual addresses
{
  "account": "{ADMIN}",
  "data": {
    "object": {
      "name": "delivery_reputation_arbitration",
      "type_parameter": "0x2::sui::SUI",
      "permission": "{PERMISSION_ADDRESS}",
      "onChain": true,
      "tags": ["delivery","arbitration"]
    },
    "description": "Food delivery dispute board",
    "location": "online",
    "bPaused": false,
    "fee_treasury": {
      "type_parameter": "0x2::sui::SUI",
      "permission": "{PERMISSION_ADDRESS}",
      "name": "delivery_arbitration_fee_pool",
      "onChain": true
    }
  }
}
```

// Agent Prompt 13: Connect arbitration system to the main delivery service
// Final step to integrate dispute resolution capabilities with the service,
// enabling customers to escalate issues and arbitrators to resolve conflicts
// Replace {ADMIN}, {SERVICE_ADDRESS}, and {ARBITRATION_ADDRESS} with your actual addresses

```json
{
  "account": "{ADMIN}",
  "data": {
    "object": "{SERVICE_ADDRESS}",
    "arbitration": {
      "op": "set",
      "objects": ["{ARBITRATION_ADDRESS}"]
    }
  }
}
```

---

By following this permission → repository → treasury → guard → machine → service → arbitration order and reusing the JSON templates above, you can safely reproduce or evolve the delivery platform without running into immutability traps. Each template mirrors a live object (`0x2930…`, `0x7af3…`, `0xa4a7…`, `0x7728…`, `0xa612…`, `0xead0…`, `0x17e1…`, `0x61f6…`, `0xd5e4…`), so cloning + minor edits is all that’s needed to roll out new cities, cuisines, or fleets.***
