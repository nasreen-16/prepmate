/**
 * Static quiz bank — works with zero AI setup. Every question is reviewed
 * content for fresher placement exams.
 */

export type QuizTopic = "aptitude" | "dbms" | "oop" | "os" | "cn";

export type QuizQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
};

export const QUIZ_TOPICS: { id: QuizTopic; name: string; blurb: string; icon: string }[] = [
  { id: "aptitude", name: "Quantitative Aptitude", blurb: "Percentages, ratios, time & work, probability", icon: "sigma" },
  { id: "dbms", name: "DBMS", blurb: "Normalization, transactions, SQL, indexes", icon: "database" },
  { id: "oop", name: "OOP", blurb: "Classes, inheritance, polymorphism, SOLID", icon: "boxes" },
  { id: "os", name: "Operating Systems", blurb: "Processes, scheduling, memory, deadlocks", icon: "cpu" },
  { id: "cn", name: "Computer Networks", blurb: "OSI, TCP/IP, routing, HTTP", icon: "network" },
];

export const QUIZ_BANK: Record<QuizTopic, QuizQuestion[]> = {
  aptitude: [
    { id: "apt1", question: "A product is marked 40% above cost and sold at a 20% discount on the marked price. What is the profit percentage?", options: ["12%", "16%", "20%", "8%"], answerIndex: 0, explanation: "Cost 100 → marked 140 → sold at 20% off = 112, so profit is 12%." },
    { id: "apt2", question: "If 6 workers build a wall in 12 days, how long will 9 workers take (same rate)?", options: ["8 days", "9 days", "10 days", "7.5 days"], answerIndex: 0, explanation: "Work = 6×12 = 72 worker-days; 72/9 = 8 days." },
    { id: "apt3", question: "The average of 5 numbers is 27. If one number 35 is removed, the new average is:", options: ["25", "24", "26", "23.5"], answerIndex: 0, explanation: "Total = 135; removing 35 leaves 100 over 4 numbers = 25." },
    { id: "apt4", question: "A train 150 m long crosses a pole in 10 seconds. Its speed is:", options: ["54 km/h", "45 km/h", "50 km/h", "60 km/h"], answerIndex: 0, explanation: "15 m/s × 3.6 = 54 km/h." },
    { id: "apt5", question: "Two fair dice are rolled. What is the probability the sum is 8?", options: ["5/36", "1/6", "1/9", "7/36"], answerIndex: 0, explanation: "Favorable pairs: (2,6),(3,5),(4,4),(5,3),(6,2) → 5 of 36 outcomes." },
    { id: "apt6", question: "A sum doubles in 8 years at simple interest. The annual rate is:", options: ["12.5%", "10%", "15%", "8%"], answerIndex: 0, explanation: "Interest equals principal in 8 years: rate = 100/8 = 12.5%." },
    { id: "apt7", question: "If A:B = 2:3 and B:C = 4:5, then A:C is:", options: ["8:15", "2:5", "3:5", "8:9"], answerIndex: 0, explanation: "A:B:C = 8:12:15, so A:C = 8:15." },
    { id: "apt8", question: "A car covers the first half of a distance at 40 km/h and the second half at 60 km/h. The average speed is:", options: ["48 km/h", "50 km/h", "45 km/h", "52 km/h"], answerIndex: 0, explanation: "Harmonic mean for equal distances: 2·40·60/(40+60) = 48 km/h." },
    { id: "apt9", question: "How many 3-digit numbers are divisible by 9?", options: ["100", "99", "101", "98"], answerIndex: 0, explanation: "From 108 to 999: (999−108)/9 + 1 = 100." },
    { id: "apt10", question: "A mixture of 60 L has milk and water 7:3. How much water must be added to make it 7:5?", options: ["12 L", "10 L", "15 L", "8 L"], answerIndex: 0, explanation: "Milk 42 L stays fixed; water must become 30 L, so add 12 L." },
    { id: "apt11", question: "What comes next: 2, 6, 12, 20, 30, …?", options: ["42", "40", "36", "44"], answerIndex: 0, explanation: "Differences 4, 6, 8, 10 → next difference 12 gives 42 (pattern n(n+1))." },
    { id: "apt12", question: "The compound interest on ₹10,000 at 10% p.a. for 2 years is:", options: ["₹2,100", "₹2,000", "₹2,200", "₹1,990"], answerIndex: 0, explanation: "10000·(1.1)² = 12100, so CI = 2100." },
  ],
  dbms: [
    { id: "dbms1", question: "Which normal form removes transitive dependencies?", options: ["3NF", "2NF", "1NF", "BCNF"], answerIndex: 0, explanation: "3NF requires every non-key attribute to depend only on candidate keys, eliminating transitive dependencies." },
    { id: "dbms2", question: "Which property of ACID guarantees that committed changes survive crashes?", options: ["Durability", "Consistency", "Isolation", "Atomicity"], answerIndex: 0, explanation: "Durability ensures committed transactions persist even after a system failure." },
    { id: "dbms3", question: "A candidate key that is not chosen as the primary key is called:", options: ["Alternate key", "Foreign key", "Super key", "Composite key"], answerIndex: 0, explanation: "Remaining candidate keys become alternate keys." },
    { id: "dbms4", question: "Which SQL clause filters rows after GROUP BY aggregation?", options: ["HAVING", "WHERE", "ORDER BY", "LIMIT"], answerIndex: 0, explanation: "WHERE filters rows before grouping; HAVING filters aggregated groups." },
    { id: "dbms5", question: "An index built on a column improves which operation the most?", options: ["SELECT with a WHERE match on that column", "INSERT", "Bulk UPDATE of all rows", "TRUNCATE"], answerIndex: 0, explanation: "Indexes speed up lookups (point queries) but add cost to writes." },
    { id: "dbms6", question: "A relation is in BCNF if, for every non-trivial FD X→Y:", options: ["X is a superkey", "Y is a prime attribute", "X is a prime attribute", "Y is fully dependent on the primary key"], answerIndex: 0, explanation: "BCNF demands the determinant of every non-trivial dependency be a superkey." },
    { id: "dbms7", question: "Which join returns all rows of the left table with matching right-table rows (NULL if none)?", options: ["LEFT OUTER JOIN", "INNER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN"], answerIndex: 0, explanation: "LEFT OUTER JOIN preserves unmatched left rows with NULLs on the right side." },
    { id: "dbms8", question: "The schedule of two transactions where T1 reads a value written by T2, then T2 aborts, violates:", options: ["Recoverability", "Serializability", "Durability", "Redundancy"], answerIndex: 0, explanation: "Reading uncommitted data that later aborts creates a dirty read and an unrecoverable schedule unless cascaded rollback happens." },
    { id: "dbms9", question: "B+ trees are preferred over B trees for databases because:", options: ["All data is in leaf nodes linked for fast range scans", "They have shorter height always", "They need less memory per node", "They avoid locking"], answerIndex: 0, explanation: "Leaf-linked structure makes range queries and full scans efficient." },
    { id: "dbms10", question: "A view in SQL is:", options: ["A virtual table defined by a query", "A physical copy of a table", "An index on a table", "A stored procedure"], answerIndex: 0, explanation: "Views store the query, not the data (unless materialized)." },
    { id: "dbms11", question: "Which concurrency-control protocol uses timestamps to order conflicting operations?", options: ["Timestamp-based protocol", "Two-phase locking", "Banker's algorithm", "Binary locking"], answerIndex: 0, explanation: "Timestamp ordering validates conflicting reads/writes against transaction timestamps." },
    { id: "dbms12", question: "Lossless-join decomposition means:", options: ["The original relation can be reconstructed by joining the pieces", "No attributes are lost ever", "Every piece is in 3NF", "Joining adds extra rows only"], answerIndex: 0, explanation: "Natural join of the decomposed relations yields exactly the original rows." },
  ],
  oop: [
    { id: "oop1", question: "Bundling data and methods together while hiding internal details is:", options: ["Encapsulation", "Inheritance", "Abstraction", "Polymorphism"], answerIndex: 0, explanation: "Encapsulation packages state with behavior and restricts direct access." },
    { id: "oop2", question: "Method overriding requires the subclass method to have:", options: ["The same signature as the parent method", "A different name", "A different parameter list", "Static binding"], answerIndex: 0, explanation: "Overriding redefines an inherited method with the same signature; dispatch is dynamic." },
    { id: "oop3", question: "Which statement about abstract classes is true?", options: ["They can contain both abstract and concrete methods", "They cannot have constructors", "They can be instantiated directly", "They cannot have fields"], answerIndex: 0, explanation: "Abstract classes mix implemented and abstract members and are instantiated only via subclasses." },
    { id: "oop4", question: "Overloading a method means:", options: ["Multiple methods share a name but differ in parameter lists", "A subclass redefines a method", "A method becomes private", "A method returns different types randomly"], answerIndex: 0, explanation: "Overloading is compile-time (static) polymorphism via distinct signatures." },
    { id: "oop5", question: "The 'is-a' relationship is best modeled with:", options: ["Inheritance", "Composition", "Aggregation", "Encapsulation"], answerIndex: 0, explanation: "Inheritance models is-a; composition models has-a." },
    { id: "oop6", question: "The Open/Closed principle states classes should be:", options: ["Open for extension, closed for modification", "Open for modification only", "Closed to subclassing", "Always final"], answerIndex: 0, explanation: "Extend behavior via new code/subclasses rather than editing tested code." },
    { id: "oop7", question: "A static method in a class:", options: ["Belongs to the class, not instances", "Can access instance fields directly", "Is overridden polymorphically", "Requires an object to call"], answerIndex: 0, explanation: "Static members are class-level and cannot touch instance state directly." },
    { id: "oop8", question: "Composition differs from aggregation because the composed part:", options: ["Has no independent lifecycle outside the whole", "Is always a base class", "Is shared by many owners", "Is only an interface"], answerIndex: 0, explanation: "Composition owns the part's lifecycle; aggregation allows sharing." },
    { id: "oop9", question: "Tight coupling is bad because:", options: ["Changes in one class force changes in dependents", "It slows runtime always", "It increases inheritance depth", "It breaks encapsulation only"], answerIndex: 0, explanation: "Coupled classes must change together, hurting maintainability." },
    { id: "oop10", question: "Which access level allows access within the same package (or namespace) but not from arbitrary external code?", options: ["Protected / internal (language-dependent)", "Private", "Public", "None of these"], answerIndex: 0, explanation: "Protected/internal grants broader-than-private access limited to package or subclasses." },
    { id: "oop11", question: "A virtual function enables:", options: ["Runtime polymorphism through base-class pointers", "Compile-time binding", "Static memory allocation", "Operator overloading"], answerIndex: 0, explanation: "Virtual dispatch chooses the override by the object's dynamic type at runtime." },
    { id: "oop12", question: "Liskov's substitution principle requires subclasses to:", options: ["Be usable anywhere the base class is expected without breaking behavior", "Override every method", "Be final", "Avoid constructors"], answerIndex: 0, explanation: "Subtypes must honor the base contract so substitution is safe." },
  ],
  os: [
    { id: "os1", question: "The key difference between a process and a thread is:", options: ["Threads share the address space of their process", "Threads have no stack", "Processes cannot communicate", "Threads are always slower"], answerIndex: 0, explanation: "Threads within a process share memory; processes are isolated." },
    { id: "os2", question: "Which is NOT a necessary condition for deadlock?", options: ["Preemption", "Mutual exclusion", "Hold and wait", "Circular wait"], answerIndex: 0, explanation: "The four conditions are mutual exclusion, hold and wait, no preemption and circular wait." },
    { id: "os3", question: "Round-robin scheduling with a very large time quantum behaves like:", options: ["FCFS", "SJF", "Priority scheduling", "SRTF"], answerIndex: 0, explanation: "With a huge quantum, processes run to completion in arrival order = FCFS." },
    { id: "os4", question: "Thrashing occurs when:", options: ["The system spends more time paging than executing", "CPU utilization is 100%", "A deadlock is detected", "The ready queue is empty"], answerIndex: 0, explanation: "Excessive page faults from over-committed memory cause thrashing." },
    { id: "os5", question: "A binary semaphore initialized to 1 acts like a:", options: ["Mutex lock", "Counter", "Condition variable", "Scheduler"], answerIndex: 0, explanation: "0/1 semaphore with wait/signal provides mutual exclusion." },
    { id: "os6", question: "Belady's anomaly is seen in which page replacement algorithm?", options: ["FIFO", "LRU", "Optimal", "Clock"], answerIndex: 0, explanation: "FIFO can have more page faults with more frames; LRU and Optimal are stack algorithms." },
    { id: "os7", question: "Virtual memory allows:", options: ["Execution of processes larger than physical RAM", "Faster disk I/O only", "No page faults ever", "Direct device access"], answerIndex: 0, explanation: "Demand paging keeps only needed pages in RAM." },
    { id: "os8", question: "A context switch between threads of the same process is cheaper than between processes because:", options: ["No address space switch is needed", "Registers are not saved", "The kernel is bypassed", "Threads share scheduling priority"], answerIndex: 0, explanation: "Same-process threads share page tables and TLB entries." },
    { id: "os9", question: "A race condition happens when:", options: ["Result depends on the timing of concurrent accesses to shared data", "Two processes deadlock", "A page fault repeats", "A signal is lost"], answerIndex: 0, explanation: "Unsynchronized concurrent access to shared state makes outcomes timing-dependent." },
    { id: "os10", question: "Internal fragmentation is associated with:", options: ["Fixed-size allocation units like pages", "Variable-size segments", "Swap compression", "TLB misses"], answerIndex: 0, explanation: "Unused space inside fixed-size blocks is internal fragmentation." },
    { id: "os11", question: "The fork() system call:", options: ["Creates a child process that is a copy of the caller", "Creates a thread", "Replaces the current process image", "Opens a pipe"], answerIndex: 0, explanation: "fork duplicates the calling process; exec replaces its image." },
    { id: "os12", question: "Banker's algorithm is used for:", options: ["Deadlock avoidance with maximum resource claims", "Page replacement", "Disk scheduling", "Process creation"], answerIndex: 0, explanation: "It grants a request only if a safe state remains." },
  ],
  cn: [
    { id: "cn1", question: "Which OSI layer handles end-to-end reliable delivery?", options: ["Transport", "Network", "Data link", "Session"], answerIndex: 0, explanation: "The transport layer (e.g., TCP) provides end-to-end reliability and flow control." },
    { id: "cn2", question: "UDP differs from TCP because UDP:", options: ["Is connectionless with no delivery guarantee", "Uses a three-way handshake", "Guarantees ordering", "Retransmits lost segments"], answerIndex: 0, explanation: "UDP is a lightweight datagram protocol without handshakes or retransmission." },
    { id: "cn3", question: "The TCP three-way handshake sequence is:", options: ["SYN, SYN-ACK, ACK", "SYN, ACK, FIN", "ACK, SYN, ACK", "SYN, FIN, ACK"], answerIndex: 0, explanation: "Connection setup is SYN → SYN-ACK → ACK." },
    { id: "cn4", question: "DNS primarily translates:", options: ["Domain names to IP addresses", "IP addresses to MAC addresses", "Ports to processes", "URLs to HTML"], answerIndex: 0, explanation: "DNS resolves human-readable names into IP addresses." },
    { id: "cn5", question: "ARP is used to find:", options: ["The MAC address for a known IP in the local network", "The IP for a domain", "The route to a host", "The MTU of a link"], answerIndex: 0, explanation: "ARP broadcasts 'who has this IP?' and learns the corresponding MAC." },
    { id: "cn6", question: "Which layer of TCP/IP corresponds most closely to the OSI data-link layer?", options: ["Network access (link) layer", "Internet layer", "Transport layer", "Application layer"], answerIndex: 0, explanation: "The link layer maps to OSI layers 1–2." },
    { id: "cn7", question: "HTTPS secures HTTP using:", options: ["TLS encryption between client and server", "IPSec only", "Base64 encoding", "MAC filtering"], answerIndex: 0, explanation: "HTTPS is HTTP over TLS, providing confidentiality and integrity." },
    { id: "cn8", question: "In the address 192.168.1.0/26, how many usable host addresses exist per subnet?", options: ["62", "64", "30", "126"], answerIndex: 0, explanation: "/26 leaves 6 host bits → 64 addresses minus network and broadcast = 62." },
    { id: "cn9", question: "A router forwards packets based on:", options: ["Destination IP address", "Destination MAC address", "Port numbers only", "Frame checksums"], answerIndex: 0, explanation: "Layer-3 routing decisions use destination IP and the routing table." },
    { id: "cn10", question: "TCP slow start:", options: ["Doubles the congestion window each RTT until a threshold", "Keeps window constant", "Cuts the window on every ACK", "Applies only to UDP"], answerIndex: 0, explanation: "Exponential growth of cwnd per RTT during slow start, up to ssthresh." },
    { id: "cn11", question: "Port 443 is the default port for:", options: ["HTTPS", "HTTP", "FTP", "SMTP"], answerIndex: 0, explanation: "443 is the well-known TLS/HTTPS port; 80 is plain HTTP." },
    { id: "cn12", question: "NAT allows:", options: ["Many private IPs to share one public IP", "Faster routing tables", "Encryption of packets", "Multicast distribution"], answerIndex: 0, explanation: "NAT rewrites private source addresses to a shared public address." },
  ],
};
