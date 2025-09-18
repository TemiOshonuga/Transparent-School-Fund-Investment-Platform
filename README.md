# EduFund DAO: Transparent School Fund Investment Platform

## Overview

EduFund DAO is a Web3 project built on the Stacks blockchain using Clarity smart contracts. It addresses real-world problems in educational funding by providing a decentralized, transparent system for investing school funds. Schools often face issues like opaque fund management, potential corruption, inefficient investments, and lack of accountability. EduFund solves these by:

- Allowing schools to deposit funds into a secure vault.
- Enabling community-driven investment proposals and voting (e.g., by parents, teachers, and admins).
- Tracking all investments and returns on-chain for immutable transparency.
- Automatically distributing returns to school initiatives or reinvesting them.
- Providing auditable logs to prevent misuse and build trust.

This ensures every penny is tracked via blockchain, reducing fraud and empowering stakeholders. Investments could target low-risk DeFi opportunities on Stacks (e.g., staking STX or tokenized assets), with returns funding school improvements like scholarships or infrastructure.

The project involves 6 core smart contracts written in Clarity, emphasizing security, predictability, and composability. Clarity's design prevents common vulnerabilities like reentrancy.

## Problems Solved

- **Lack of Transparency**: Traditional school funds are managed off-chain, leading to mistrust. Blockchain logs ensure every transaction is verifiable.
- **Inefficient Investments**: Schools often hold idle funds; EduFund enables community-voted investments for better returns.
- **Corruption and Mismanagement**: Immutable tracking prevents unauthorized withdrawals.
- **Stakeholder Exclusion**: DAOs allow parents/teachers to participate in decisions.
- **Auditing Challenges**: On-chain data simplifies compliance and reporting.

## Architecture

EduFund consists of 6 interconnected Clarity smart contracts. Each is designed to be modular, with clear interfaces for interaction. Below is a high-level overview; full code would be in separate `.clar` files.

### 1. FundVault Contract
   - **Purpose**: Securely holds deposited funds (STX or SIP-10 tokens) and manages deposits/withdrawals.
   - **Key Functions**:
     - `deposit-funds`: Allows authorized users (e.g., school admins) to deposit funds.
     - `withdraw-funds`: Restricted withdrawal to approved addresses after voting.
     - `get-balance`: Public read to view total funds.
   - **Traits Used**: Implements fungible token traits for token handling.
   - **Security**: Only callable by governance or after proposal approval.

### 2. ProposalManager Contract
   - **Purpose**: Handles creation and management of investment proposals (e.g., "Invest 10% in STX staking").
   - **Key Functions**:
     - `create-proposal`: Submits a new investment idea with details (amount, target, expected ROI).
     - `get-proposal-details`: Retrieves proposal info by ID.
     - `close-proposal`: Ends a proposal after voting period.
   - **Integration**: Links to Voting contract for decision-making.
   - **Security**: Proposals require a minimum deposit to prevent spam.

### 3. VotingGovernance Contract
   - **Purpose**: Enables DAO-style voting on proposals using governance tokens (e.g., distributed to stakeholders).
   - **Key Functions**:
     - `vote-on-proposal`: Cast yes/no votes with token weight.
     - `tally-votes`: Computes results after voting ends.
     - `execute-proposal`: Triggers investment if approved.
   - **Traits Used**: Uses NFT or FT traits for voting power.
   - **Security**: Quadratic voting to prevent whale dominance; time-locked voting periods.

### 4. InvestmentTracker Contract
   - **Purpose**: Tracks active investments, monitors performance, and logs returns.
   - **Key Functions**:
     - `initiate-investment`: Records a new investment post-approval.
     - `update-returns`: Oracles or admins update ROI (integrate with external price feeds via Stacks oracles).
     - `get-investment-status`: Public read for current value and history.
   - **Integration**: Calls FundVault to release funds and logs to TransparencyLedger.
   - **Security**: Only callable by approved oracles for updates to prevent manipulation.

### 5. ReturnDistributor Contract
   - **Purpose**: Automatically distributes investment returns (e.g., 50% reinvest, 50% to school wallet).
   - **Key Functions**:
     - `claim-returns`: Triggers distribution based on predefined rules.
     - `set-distribution-rules`: Governance-voted updates to allocation (e.g., percentages for scholarships).
     - `get-pending-returns`: Views undistributed gains.
   - **Integration**: Pulls data from InvestmentTracker and pushes to FundVault.
   - **Security**: Multi-sig or timelocks on large distributions.

### 6. TransparencyLedger Contract
   - **Purpose**: Immutable logging of all transactions for auditing and public transparency.
   - **Key Functions**:
     - `log-transaction`: Records events (deposits, investments, returns) with timestamps and details.
     - `query-logs`: Filters and retrieves logs by type/date/range.
     - `generate-report`: Compiles summaries for off-chain viewing.
   - **Integration**: Called as a hook from all other contracts.
   - **Security**: Append-only; no deletions allowed.

## How It Works

1. **Setup**: Deploy contracts on Stacks testnet/mainnet. School admins mint governance tokens for stakeholders.
2. **Deposit**: Funds are deposited into FundVault.
3. **Propose & Vote**: Stakeholders create proposals via ProposalManager and vote using VotingGovernance.
4. **Invest**: Approved proposals trigger InvestmentTracker to release funds from FundVault.
5. **Track & Update**: Returns are monitored and updated in InvestmentTracker.
6. **Distribute**: ReturnDistributor allocates gains back to the school or reinvests.
7. **Audit**: Anyone can query TransparencyLedger for full history.

Frontend (not included): A simple web app using Stacks.js to interact with contracts, displaying dashboards for balances, proposals, and logs.

## Installation and Deployment

### Prerequisites
- Stacks CLI (install via `npm install -g @stacks/cli`).
- Clarity development environment (e.g., Clarinet for testing).
- STX wallet for deployment.

### Steps
1. Clone the repo: `git clone <repo-url>`
2. Install dependencies: `cd edufund-dao && npm install` (for any JS tools).
3. Test contracts: Use Clarinet to simulate: `clarinet test`.
4. Deploy to testnet: `stacks deploy FundVault.clar --testnet` (repeat for each contract).
5. Interact: Use Stacks explorer or custom scripts to call functions.

### Contract Deployment Order
- Deploy AccessControl first (if added as a 7th for roles).
- Then FundVault, ProposalManager, VotingGovernance.
- Follow with InvestmentTracker, ReturnDistributor, TransparencyLedger.
- Set principals and traits to interlink them.

## Development Notes
- **Clarity Code Style**: All contracts use Clarity's functional paradigm. Example snippet for FundVault:
  ```
  (define-data-var total-balance uint u0)

  (define-public (deposit-funds (amount uint))
    (begin
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      (var-set total-balance (+ (var-get total-balance) amount))
      (ok true)))
  ```
- **Testing**: Use Clarinet for unit tests, simulating multi-contract calls.
- **Security Audits**: Recommend auditing via Stacks ecosystem partners before mainnet.
- **Extensions**: Integrate with Bitcoin L2 for cross-chain investments.

## License
MIT License. Feel free to fork and contribute!