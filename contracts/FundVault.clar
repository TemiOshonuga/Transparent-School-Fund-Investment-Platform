;; FundVault.clar

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-MAX-DEPOSIT u101)
(define-constant ERR-INVALID-MIN-WITHDRAW u102)
(define-constant ERR-INVALID-LOCK-PERIOD u103)
(define-constant ERR-INVALID-PENALTY-RATE u104)
(define-constant ERR-INVALID-APPROVAL-THRESH u105)
(define-constant ERR-VAULT-ALREADY-EXISTS u106)
(define-constant ERR-VAULT-NOT-FOUND u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-MIN-DEPOSIT u110)
(define-constant ERR-INVALID-MAX_WITHDRAW u111)
(define-constant ERR-VAULT-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-VAULTS-EXCEEDED u114)
(define-constant ERR-INVALID-VAULT-TYPE u115)
(define-constant ERR-INVALID-INTEREST-RATE u116)
(define-constant ERR-INVALID-GRACE-PERIOD u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-CURRENCY u119)
(define-constant ERR-INVALID-STATUS u120)
(define-constant ERR-INSUFFICIENT-BALANCE u121)
(define-constant ERR-LOCK-PERIOD-NOT-EXPIRED u122)
(define-constant ERR-INVALID-AMOUNT u123)
(define-constant ERR-INVALID-RECIPIENT u124)
(define-constant ERR-DEPOSIT-EXCEEDS-MAX u125)
(define-constant ERR-WITHDRAW-BELOW-MIN u126)

(define-data-var next-vault-id uint u0)
(define-data-var max-vaults uint u1000)
(define-data-var creation-fee uint u1000)
(define-data-var authority-contract (optional principal) none)

(define-map vaults
  uint
  {
    name: (string-utf8 100),
    max-deposit: uint,
    min-withdraw: uint,
    lock-period: uint,
    penalty-rate: uint,
    approval-thresh: uint,
    timestamp: uint,
    creator: principal,
    vault-type: (string-utf8 50),
    interest-rate: uint,
    grace-period: uint,
    location: (string-utf8 100),
    currency: (string-utf8 20),
    status: bool,
    min-deposit: uint,
    max-withdraw: uint,
    total-balance: uint
  }
)

(define-map vaults-by-name
  (string-utf8 100)
  uint)

(define-map vault-updates
  uint
  {
    update-name: (string-utf8 100),
    update-max-deposit: uint,
    update-min-withdraw: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-map deposit-logs
  { vault-id: uint, depositor: principal }
  {
    amount: uint,
    timestamp: uint
  }
)

(define-map withdrawal-logs
  { vault-id: uint, withdrawer: principal }
  {
    amount: uint,
    timestamp: uint,
    penalty: uint
  }
)

(define-read-only (get-vault (id uint))
  (map-get? vaults id)
)

(define-read-only (get-vault-updates (id uint))
  (map-get? vault-updates id)
)

(define-read-only (is-vault-registered (name (string-utf8 100)))
  (is-some (map-get? vaults-by-name name))
)

(define-read-only (get-deposit-log (vault-id uint) (depositor principal))
  (map-get? deposit-logs { vault-id: vault-id, depositor: depositor })
)

(define-read-only (get-withdrawal-log (vault-id uint) (withdrawer principal))
  (map-get? withdrawal-logs { vault-id: vault-id, withdrawer: withdrawer })
)

(define-read-only (get-vault-balance (id uint))
  (ok (get total-balance (unwrap! (get-vault id) (err ERR-VAULT-NOT-FOUND))))
)

(define-private (validate-name (name (string-utf8 100)))
  (if (and (> (len name) u0) (<= (len name) u100))
      (ok true)
      (err ERR-INVALID-UPDATE-PARAM))
)

(define-private (validate-max-deposit (deposit uint))
  (if (and (> deposit u0) (<= deposit u1000000000))
      (ok true)
      (err ERR-INVALID-MAX-DEPOSIT))
)

(define-private (validate-min-withdraw (withdraw uint))
  (if (> withdraw u0)
      (ok true)
      (err ERR-INVALID-MIN-WITHDRAW))
)

(define-private (validate-lock-period (period uint))
  (if (> period u0)
      (ok true)
      (err ERR-INVALID-LOCK-PERIOD))
)

(define-private (validate-penalty-rate (rate uint))
  (if (<= rate u100)
      (ok true)
      (err ERR-INVALID-PENALTY-RATE))
)

(define-private (validate-approval-thresh (thresh uint))
  (if (and (> thresh u0) (<= thresh u100))
      (ok true)
      (err ERR-INVALID-APPROVAL_THRESH))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-vault-type (type (string-utf8 50)))
  (if (or (is-eq type "school") (is-eq type "community") (is-eq type "endowment"))
      (ok true)
      (err ERR-INVALID-VAULT-TYPE))
)

(define-private (validate-interest-rate (rate uint))
  (if (<= rate u20)
      (ok true)
      (err ERR-INVALID-INTEREST-RATE))
)

(define-private (validate-grace-period (period uint))
  (if (<= period u30)
      (ok true)
      (err ERR-INVALID-GRACE-PERIOD))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "USD") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-min-deposit (min uint))
  (if (> min u0)
      (ok true)
      (err ERR-INVALID-MIN-DEPOSIT))
)

(define-private (validate-max-withdraw (max uint))
  (if (> max u0)
      (ok true)
      (err ERR-INVALID-MAX_WITHDRAW))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-private (validate-amount (amount uint))
  (if (> amount u0)
      (ok true)
      (err ERR-INVALID-AMOUNT))
)

(define-private (validate-recipient (recipient principal))
  (if (not (is-eq recipient tx-sender))
      (ok true)
      (err ERR-INVALID-RECIPIENT))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-vaults (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-vaults new-max)
    (ok true)
  )
)

(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set creation-fee new-fee)
    (ok true)
  )
)

(define-public (create-vault
  (vault-name (string-utf8 100))
  (max-deposit uint)
  (min-withdraw uint)
  (lock-period uint)
  (penalty-rate uint)
  (approval-thresh uint)
  (vault-type (string-utf8 50))
  (interest-rate uint)
  (grace-period uint)
  (location (string-utf8 100))
  (currency (string-utf8 20))
  (min-deposit uint)
  (max-withdraw uint)
)
  (let (
        (next-id (var-get next-vault-id))
        (current-max (var-get max-vaults))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-VAULTS-EXCEEDED))
    (try! (validate-name vault-name))
    (try! (validate-max-deposit max-deposit))
    (try! (validate-min-withdraw min-withdraw))
    (try! (validate-lock-period lock-period))
    (try! (validate-penalty-rate penalty-rate))
    (try! (validate-approval-thresh approval-thresh))
    (try! (validate-vault-type vault-type))
    (try! (validate-interest-rate interest-rate))
    (try! (validate-grace-period grace-period))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (try! (validate-min-deposit min-deposit))
    (try! (validate-max-withdraw max-withdraw))
    (asserts! (is-none (map-get? vaults-by-name vault-name)) (err ERR-VAULT-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get creation-fee) tx-sender authority-recipient))
    )
    (map-set vaults next-id
      {
        name: vault-name,
        max-deposit: max-deposit,
        min-withdraw: min-withdraw,
        lock-period: lock-period,
        penalty-rate: penalty-rate,
        approval-thresh: approval-thresh,
        timestamp: block-height,
        creator: tx-sender,
        vault-type: vault-type,
        interest-rate: interest-rate,
        grace-period: grace-period,
        location: location,
        currency: currency,
        status: true,
        min-deposit: min-deposit,
        max-withdraw: max-withdraw,
        total-balance: u0
      }
    )
    (map-set vaults-by-name vault-name next-id)
    (var-set next-vault-id (+ next-id u1))
    (print { event: "vault-created", id: next-id })
    (ok next-id)
  )
)

(define-public (update-vault
  (vault-id uint)
  (update-name (string-utf8 100))
  (update-max-deposit uint)
  (update-min-withdraw uint)
)
  (let ((vault (map-get? vaults vault-id)))
    (match vault
      v
        (begin
          (asserts! (is-eq (get creator v) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-name update-name))
          (try! (validate-max-deposit update-max-deposit))
          (try! (validate-min-withdraw update-min-withdraw))
          (let ((existing (map-get? vaults-by-name update-name)))
            (match existing
              existing-id
                (asserts! (is-eq existing-id vault-id) (err ERR-VAULT-ALREADY-EXISTS))
              (begin true)
            )
          )
          (let ((old-name (get name v)))
            (if (is-eq old-name update-name)
                (ok true)
                (begin
                  (map-delete vaults-by-name old-name)
                  (map-set vaults-by-name update-name vault-id)
                  (ok true)
                )
            )
          )
          (map-set vaults vault-id
            {
              name: update-name,
              max-deposit: update-max-deposit,
              min-withdraw: update-min-withdraw,
              lock-period: (get lock-period v),
              penalty-rate: (get penalty-rate v),
              approval-thresh: (get approval-thresh v),
              timestamp: block-height,
              creator: (get creator v),
              vault-type: (get vault-type v),
              interest-rate: (get interest-rate v),
              grace-period: (get grace-period v),
              location: (get location v),
              currency: (get currency v),
              status: (get status v),
              min-deposit: (get min-deposit v),
              max-withdraw: (get max-withdraw v),
              total-balance: (get total-balance v)
            }
          )
          (map-set vault-updates vault-id
            {
              update-name: update-name,
              update-max-deposit: update-max-deposit,
              update-min-withdraw: update-min-withdraw,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "vault-updated", id: vault-id })
          (ok true)
        )
      (err ERR-VAULT-NOT-FOUND)
    )
  )
)

(define-public (deposit-to-vault (vault-id uint) (amount uint))
  (let ((vault (unwrap! (map-get? vaults vault-id) (err ERR-VAULT-NOT-FOUND))))
    (try! (validate-amount amount))
    (asserts! (>= amount (get min-deposit vault)) (err ERR-INVALID-MIN-DEPOSIT))
    (asserts! (<= amount (get max-deposit vault)) (err ERR-DEPOSIT-EXCEEDS-MAX))
    (asserts! (get status vault) (err ERR-INVALID-STATUS))
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set vaults vault-id
      (merge vault { total-balance: (+ (get total-balance vault) amount) })
    )
    (map-set deposit-logs { vault-id: vault-id, depositor: tx-sender }
      { amount: amount, timestamp: block-height }
    )
    (print { event: "deposit-made", vault-id: vault-id, amount: amount })
    (ok true)
  )
)

(define-public (withdraw-from-vault (vault-id uint) (amount uint) (recipient principal))
  (let ((vault (unwrap! (map-get? vaults vault-id) (err ERR-VAULT-NOT-FOUND)))
        (deposit-log (unwrap! (get-deposit-log vault-id tx-sender) (err ERR-NOT-AUTHORIZED))))
    (try! (validate-amount amount))
    (try! (validate-recipient recipient))
    (asserts! (>= amount (get min-withdraw vault)) (err ERR-WITHDRAW-BELOW-MIN))
    (asserts! (<= amount (get max-withdraw vault)) (err ERR-INVALID-MAX_WITHDRAW))
    (asserts! (>= (get total-balance vault) amount) (err ERR-INSUFFICIENT-BALANCE))
    (asserts! (get status vault) (err ERR-INVALID-STATUS))
    (let ((lock-expiry (+ (get timestamp deposit-log) (get lock-period vault))))
      (asserts! (>= block-height lock-expiry) (err ERR-LOCK-PERIOD-NOT-EXPIRED))
    )
    (let ((penalty u0))
      (map-set vaults vault-id
        (merge vault { total-balance: (- (get total-balance vault) amount) })
      )
      (try! (as-contract (stx-transfer? amount tx-sender recipient)))
      (map-set withdrawal-logs { vault-id: vault-id, withdrawer: tx-sender }
        { amount: amount, timestamp: block-height, penalty: penalty }
      )
      (print { event: "withdrawal-made", vault-id: vault-id, amount: amount })
      (ok true)
    )
  )
)

(define-public (get-vault-count)
  (ok (var-get next-vault-id))
)

(define-public (check-vault-existence (name (string-utf8 100)))
  (ok (is-vault-registered name))
)