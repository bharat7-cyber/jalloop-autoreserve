# 🎙️ JalLoop AutoReserve — 2 to 3 Minute Hackathon Demo Script

> **Presenters Guide & Judges Walkthrough**  
> *Target Duration: 2 minutes 30 seconds*  
> *Tone: Confident, technical, mission-driven, and engaging.*

---

## ⏱️ Minute 0:00 – 0:40 | The Hook & The Urban Water Paradox

**[Speaker Action: Open the JalLoop AutoReserve Dashboard in full screen]**

> *"Judges, every modern city faces a baffling paradox.*
>
> *During dry summer heatwaves, commercial campuses and apartment complexes pay thousands of dollars for emergency water tankers. Yet during torrential rains, their rainwater harvesting tanks are already 85% full. When the downpour hits, millions of liters of clean rainwater overflow into storm drains, worsening urban street flooding and washing clean water out to sea.*
>
> *Why does this happen? Because facility managers face a terrible dilemma: if they drain tanks blindly before a storm and the rain falls short, they cause an artificial water crisis. If they hold the water, the storm floods their campus.*
>
> *We built **JalLoop AutoReserve** to eliminate this guesswork with predictive, dual-objective buffer intelligence."*

---

## ⏱️ Minute 0:40 – 1:30 | Live Architecture & Core Calculations

**[Speaker Action: Click Preset Selector -> Select "Bangalore Residential High-Rise (Monsoon Alert)"]**

> *"Let's see it in action. Here we load our Bangalore High-Rise scenario. The weather forecast predicts **65 mm** of rain over **2,400 m²** of rooftop.*
>
> *AutoReserve calculates the physical runoff:*  
> **65 mm × 2,400 m² × 0.90 runoff coefficient = 140,400 Liters of incoming rainwater.**
>
> *Look at our dynamic tank cross-section: Our primary tank has a capacity of 150,000 Liters and is already holding 115,000 Liters. That leaves only 35,000 Liters of headroom!*
>
> *Without JalLoop, over **105,000 Liters** would violently spill into municipal storm mains. But notice AutoReserve's calculation:*
>
> 1. *It calculates the building's **3.5-day safety reserve** at 63,000 Liters.*
> 2. *It recommends an exact pre-storm drawdown of **52,000 Liters**.*
> 3. *It instructs the smart actuator to discharge at **216.7 LPM** over 4 hours before the rain starts, sending water to percolation trenches.*
>
> *Most importantly: Drawdown stops **precisely at the 63,000 L safety reserve**. Even if the storm completely disappeared, the building would never run dry."*

---

## ⏱️ Minute 1:30 – 2:05 | Stress Simulation & Predictive Analytics

**[Speaker Action: Scroll to the Live 'What-If' Stress Simulator -> Slide Rain Multiplier to 1.8x]**

> *"What happens in extreme weather? Let's use our **Live What-If Stress Simulator**.*
>
> *If the storm intensifies by 80% into an unpredicted cloudburst, AutoReserve immediately shifts into **Emergency Bypass Mode**, modulates the motorized valve, and alerts facility engineers to engage high-capacity bypass pumps to safeguard electrical basements.*
>
> *If we shift into a heatwave with 4mm of rain, AutoReserve instantly switches into **Heatwave Defense Mode**, locks all valves to 0 LPM, and recommends graywater loop diversion."*

**[Speaker Action: Scroll to Charts Section -> Toggle "JalLoop vs Conventional"]**

> *"Our comparative analytics chart shows the immediate impact: zero uncontrolled flood spillage and 100% harvested retention."*

---

## ⏱️ Minute 2:05 – 2:30 | Cloud Architecture & Wrap-Up

**[Speaker Action: Click on "Storage: Local SQLite / AWS DynamoDB" Badge in Navbar to display Modal]**

> *"Under the hood, JalLoop AutoReserve is built on a high-performance stack:*
>
> - *A **React 19 + Vite** frontend with custom SVG hydraulics and live simulated IoT telemetry.*
> - *A **Python FastAPI** computational core running serverless on **AWS Lambda** via **Mangum** and **AWS API Gateway**.*
> - *Dual-mode persistence in **AWS DynamoDB** with transparent local SQLite fallback and 100% offline client resilience.*
>
> *All 11 backend unit and integration tests are passing, and production builds are completely clean.*
>
> *JalLoop AutoReserve turns static rainwater tanks into dynamic climate-resilience assets. Thank you!"*

---

## 💡 Quick Tips for the Q&A Session

1. **"What if the weather forecast is inaccurate?"**  
   *Answer:* "That is the core mathematical constraint of AutoReserve! Pre-storm drawdown is mathematically bounded by $V_{\text{max\_drawdown}} = \text{Current Level} - \text{Safety Reserve}$. Even if rainfall is 0 mm, the building retains its full multi-day emergency reserve."

2. **"Where does the drawn-down water go?"**  
   *Answer:* "Instead of overwhelming city drains during the peak storm, drawn-down water is released 4 to 8 hours *prior* to storm arrival into secondary holding sumps, deep groundwater percolation wells, or campus irrigation."

3. **"How does it deploy to AWS?"**  
   *Answer:* "We have an included AWS SAM template (`template.yaml`) that creates the DynamoDB table, Lambda function, and API Gateway with a single command: `sam deploy`."
