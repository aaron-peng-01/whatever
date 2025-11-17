### Delivery

Delivery is a Wowok-native food delivery network that combines merchant craftsmanship, trusted couriers, and programmable workflows. Customers describe the meal and constraints once; Service objects, Machine workflows, Guards, and Repository data make sure every promise is executed transparently.

### Core Capability

- **Programmable Trust**
  
  Every role—customer, merchant, courier—is bound to Guards and Permissions. Payments, refunds, and reputation updates only happen when the workflow reaches the right nodes.

- **Evidence-Driven Reputation**
  
  The shared Repository captures merchant prep snapshots, rider geolocation, and customer feedback. Guards and arbitration can query the same dataset, giving everyone a single source of truth.

- **Instant Reconfiguration**
  
  Need a new merchant or courier? Clone the Permission/Machine/Service objects, swap in new addresses, and keep the battle-tested workflow unchanged.

- **Dispute Automation**
  
  Arbitration objects link directly to every Service. When disputes happen, the same reputation data and workflow history feed into arbitrator judgments and Treasury-managed payouts.

## Inspiration Scenarios

- **Lunch Rush**
  
  Multiple merchants share the same workflow and Guard set. Couriers can accept new routes only when their previous nodes are validated.

- **Premium Experiences**
  
  Extend the Repository schema with tasting notes, sommelier feedback, or photo proof, then reuse the same withdrawal guard to ensure bonuses unlock only after customers confirm receipt.

- **Regional Fleets**
  
  Clone the Machine for a new city. Each clone references a different merchant/courier set but keeps the arbitration + reputation logic consistent.

## Implementation Case Snapshot

### Delivery Platform: Building Blocks

- **Permission** `0x1b9aa15e…96c1a` manages all operators and custom permissions (1120–1123).
- **Repository** `0x61f69895…c8cb` stores `customer_verification`, `order_ready_snapshot`, `rider_geolocation`, and `order_reputation_record`.
- **Guards**
  - `guard_customer_verified` `0x2930…f06d` ensures only approved buyers confirm/operate.
  - `guard_merchant_operator` `0x7af3…aab9` locks merchant nodes to the real merchant.
  - `guard_rider_operator` `0xa4a7…4c4e` locks courier nodes to the registered rider.
  - `guard_reputation_withdraw` `0x7728…932a` blocks withdrawals until the workflow reaches the validation node.
- **Machine** `0xead0adee…a7be` is the published workflow with Guard-protected forwards.
- **Service** `0x17e18c19…b699` exposes “Food Menu” with the same Guards & Treasury.
- **Treasury** `0xa6125d86…6a9e` aggregates payments and incentives.
- **Arbitration** `0xd5e45309…468d` + fee Treasury `0x9f1f1199…97c8` resolve disputes based on the shared evidence.

This stack delivers a repeatable food delivery experience: customers, merchants, riders, and arbitrators all act against the same programmable rules, and every node is backed by on-chain data rather than verbal promises.
