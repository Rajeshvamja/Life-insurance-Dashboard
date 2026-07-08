// ===============================================
// LIFE INSURANCE DASHBOARD
// Part 3A
// Google Sheet Connection
// ===============================================

// Your Published Google Sheet CSV
const CSV_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7HIqFoP3zAdtXxvvhh-1lOZt6ObCp4Cefrsu8iFgUyeOqsNaA46GZfSc_czpIFcuqCt_o3utl1PDq/pub?gid=1290470203&single=true&output=csv";

let dashboardData = [];

let rmChart;
let companyChart;
let monthlyChart;
let leaderChart;
let medicalChart;
let insuranceChart;
let mapChart;


// ===============================================
// Load Dashboard
// ===============================================

window.onload = () => {

    updateClock();

    setInterval(updateClock,1000);

    loadDashboard();

    setInterval(loadDashboard,30000);

}


// ===============================================
// Fetch Google Sheet
// ===============================================

async function loadDashboard(){

    try{

        document.getElementById("lastUpdated").innerHTML="Loading...";

        const response = await fetch(CSV_URL);

        const csv = await response.text();

        dashboardData = csvToJSON(csv);

        calculateDashboard();

        buildTable();

        buildCharts();

        populateFilters();

        hideLoader();

        document.getElementById("lastUpdated").innerHTML =
        new Date().toLocaleString();

    }

    catch(e){

        console.error(e);

        alert("Unable to load Google Sheet.");

    }

}



// ===============================================
// CSV Parser
// ===============================================

function csvToJSON(csv){

const lines = csv.split("\n");

const headers = lines[0].split(",");

const result = [];

for(let i=1;i<lines.length;i++){

    if(lines[i].trim()==="") continue;

    const obj={};

    const row = lines[i].split(",");

    headers.forEach((h,index)=>{

        obj[h.trim()] = row[index]
        ? row[index].trim()
        : "";

    });

    result.push(obj);

}

return result;

}



// ===============================================
// Indian Currency
// ===============================================

function formatMoney(value){

return "₹"+Number(value).toLocaleString("en-IN");

}



// ===============================================
// Number Animation
// ===============================================

function animateValue(id,start,end,duration){

const obj=document.getElementById(id);

if(!obj) return;

let current=start;

const range=end-start;

const increment=end>start?1:-1;

let step=Math.abs(Math.floor(duration/(Math.abs(range)||1)));

if(step<5) step=5;

const timer=setInterval(()=>{

current+=increment;

obj.innerHTML=current.toLocaleString("en-IN");

if(current===end){

clearInterval(timer);

}

},step);

}



// ===============================================
// Live Clock
// ===============================================

function updateClock(){

const now=new Date();

document.getElementById("clock").innerHTML=
now.toLocaleTimeString();

}



// ===============================================
// Hide Loader
// ===============================================

function hideLoader(){

const loader=document.getElementById("loader");

if(loader){

loader.classList.add("hideLoader");

}

}
// ===========================================
// KPI CALCULATIONS
// ===========================================

function calculateDashboard() {

    if (!dashboardData.length) return;

    let totalPremium = 0;
    let issued = 0;
    let medicalPending = 0;
    let mapPending = 0;
    let insurancePending = 0;

    const rmPremium = {};
    const companyPremium = {};

    dashboardData.forEach(row => {

        // Premium
        let premium = Number(String(row["Premium"] || "0").replace(/,/g, ""));
        if (!isNaN(premium))
            totalPremium += premium;

        // Issuance
        let issue = (row["Issuance"] || "").toLowerCase();

        if (
            issue.includes("issued") ||
            issue.includes("complete") ||
            issue.includes("done")
        ) {
            issued++;
        } else {
            insurancePending++;
        }

        // Medical

        let medical = (row["Medical"] || "").toLowerCase();

        if (
            !medical.includes("done") &&
            !medical.includes("completed") &&
            medical !== ""
        ) {
            medicalPending++;
        }

        // MAP

        let map = (row["Map"] || "").toLowerCase();

        if (
            !map.includes("done") &&
            !map.includes("completed") &&
            map !== ""
        ) {
            mapPending++;
        }

        // RM Premium

        let rm = row["RM Name"] || "Unknown";

        rmPremium[rm] = (rmPremium[rm] || 0) + premium;

        // Company Premium

        let company = row["Company"] || "Unknown";

        companyPremium[company] =
            (companyPremium[company] || 0) + premium;

    });

    // ==========================
    // KPI Cards
    // ==========================

    document.getElementById("totalPremium").innerHTML =
        formatMoney(totalPremium);

    animateValue(
        "totalPolicies",
        0,
        dashboardData.length,
        1200
    );

    animateValue(
        "issuedPolicies",
        0,
        issued,
        1200
    );

    animateValue(
        "medicalPending",
        0,
        medicalPending,
        1200
    );

    animateValue(
        "pendingInsurance",
        0,
        insurancePending,
        1200
    );

    animateValue(
        "mapPending",
        0,
        mapPending,
        1200
    );

    // ==========================
    // Average Premium
    // ==========================

    let avg = dashboardData.length
        ? totalPremium / dashboardData.length
        : 0;

    document.getElementById("avgPremium").innerHTML =
        formatMoney(avg.toFixed(0));

    // ==========================
    // Today's Login
    // ==========================

    document.getElementById("todayLogin").innerHTML =
        dashboardData.length;

    // ==========================
    // Top RM
    // ==========================

    let topRM = "";

    let maxRM = 0;

    Object.keys(rmPremium).forEach(name => {

        if (rmPremium[name] > maxRM) {

            maxRM = rmPremium[name];

            topRM = name;

        }

    });

    document.getElementById("topRM").innerHTML = topRM;

    // ==========================
    // Top Company
    // ==========================

    let topCompany = "";

    let maxCompany = 0;

    Object.keys(companyPremium).forEach(name => {

        if (companyPremium[name] > maxCompany) {

            maxCompany = companyPremium[name];

            topCompany = name;

        }

    });

    document.getElementById("topCompany").innerHTML =
        topCompany;

    // ==========================
    // Summary Cards
    // ==========================

    document.getElementById("summaryPremium").innerHTML =
        formatMoney(totalPremium);

    document.getElementById("summaryPolicies").innerHTML =
        dashboardData.length;

    document.getElementById("summaryIssued").innerHTML =
        issued;

}
// ===========================================
// BUILD CHARTS
// ===========================================

function buildCharts() {

    if (!dashboardData.length) return;

    // Destroy old charts
    [
        monthlyChart,
        leaderChart,
        companyChart,
        medicalChart,
        insuranceChart,
        mapChart,
        rmChart
    ].forEach(chart => {
        if (chart) chart.destroy();
    });

    // ===========================
    // Data Containers
    // ===========================

    const monthly = {};
    const rmData = {};
    const companyData = {};

    let medicalDone = 0;
    let medicalPending = 0;

    let issued = 0;
    let issuePending = 0;

    let mapDone = 0;
    let mapPending = 0;

    dashboardData.forEach(row => {

        // ------------------------
        // Monthly Premium
        // ------------------------

        const premium = Number(
            String(row["Premium"] || "0").replace(/,/g, "")
        );

        const date = row["Login Date"] || "";

        if (date) {

            const d = new Date(date);

            const month =
                d.toLocaleString("default", {
                    month: "short"
                });

            monthly[month] =
                (monthly[month] || 0) + premium;
        }

        // ------------------------
        // RM Premium
        // ------------------------

        const rm = row["RM Name"] || "Unknown";

        rmData[rm] =
            (rmData[rm] || 0) + premium;

        // ------------------------
        // Company Premium
        // ------------------------

        const company = row["Company"] || "Unknown";

        companyData[company] =
            (companyData[company] || 0) + premium;

        // ------------------------
        // Medical
        // ------------------------

        const medical =
            (row["Medical"] || "").toLowerCase();

        if (
            medical.includes("done") ||
            medical.includes("complete")
        )
            medicalDone++;
        else
            medicalPending++;

        // ------------------------
        // MAP
        // ------------------------

        const map =
            (row["Map"] || "").toLowerCase();

        if (
            map.includes("done") ||
            map.includes("complete")
        )
            mapDone++;
        else
            mapPending++;

        // ------------------------
        // Issuance
        // ------------------------

        const issue =
            (row["Issuance"] || "").toLowerCase();

        if (
            issue.includes("issued") ||
            issue.includes("done")
        )
            issued++;
        else
            issuePending++;

    });

    // =====================================
    // Monthly Trend
    // =====================================

    monthlyChart = new Chart(
        document.getElementById("monthlyChart"),
        {
            type: "line",
            data: {
                labels: Object.keys(monthly),
                datasets: [{
                    label: "Premium",
                    data: Object.values(monthly),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,.25)",
                    fill: true,
                    tension: .4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

    // =====================================
    // RM Leaderboard
    // =====================================

    const rmSorted =
        Object.entries(rmData)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    leaderChart = new Chart(
        document.getElementById("leaderChart"),
        {
            type:"bar",
            data:{
                labels:rmSorted.map(x=>x[0]),
                datasets:[{
                    data:rmSorted.map(x=>x[1]),
                    backgroundColor:"#22c55e"
                }]
            },
            options:{
                indexAxis:"y",
                plugins:{
                    legend:{display:false}
                }
            }
        });

    // =====================================
    // Company Chart
    // =====================================

    companyChart = new Chart(
        document.getElementById("companyChart"),
        {
            type:"doughnut",
            data:{
                labels:Object.keys(companyData),
                datasets:[{
                    data:Object.values(companyData)
                }]
            }
        });

    // =====================================
    // Medical Status
    // =====================================

    medicalChart = new Chart(
        document.getElementById("medicalChart"),
        {
            type:"pie",
            data:{
                labels:["Done","Pending"],
                datasets:[{
                    data:[
                        medicalDone,
                        medicalPending
                    ]
                }]
            }
        });

    // =====================================
    // Insurance Status
    // =====================================

    insuranceChart = new Chart(
        document.getElementById("insuranceChart"),
        {
            type:"pie",
            data:{
                labels:["Issued","Pending"],
                datasets:[{
                    data:[
                        issued,
                        issuePending
                    ]
                }]
            }
        });

    // =====================================
    // MAP Status
    // =====================================

    mapChart = new Chart(
        document.getElementById("mapChart"),
        {
            type:"pie",
            data:{
                labels:["Done","Pending"],
                datasets:[{
                    data:[
                        mapDone,
                        mapPending
                    ]
                }]
            }
        });

}
// ===========================================
// BUILD CHARTS
// ===========================================

function buildCharts() {

    if (!dashboardData.length) return;

    // Destroy old charts
    [
        monthlyChart,
        leaderChart,
        companyChart,
        medicalChart,
        insuranceChart,
        mapChart,
        rmChart
    ].forEach(chart => {
        if (chart) chart.destroy();
    });

    // ===========================
    // Data Containers
    // ===========================

    const monthly = {};
    const rmData = {};
    const companyData = {};

    let medicalDone = 0;
    let medicalPending = 0;

    let issued = 0;
    let issuePending = 0;

    let mapDone = 0;
    let mapPending = 0;

    dashboardData.forEach(row => {

        // ------------------------
        // Monthly Premium
        // ------------------------

        const premium = Number(
            String(row["Premium"] || "0").replace(/,/g, "")
        );

        const date = row["Login Date"] || "";

        if (date) {

            const d = new Date(date);

            const month =
                d.toLocaleString("default", {
                    month: "short"
                });

            monthly[month] =
                (monthly[month] || 0) + premium;
        }

        // ------------------------
        // RM Premium
        // ------------------------

        const rm = row["RM Name"] || "Unknown";

        rmData[rm] =
            (rmData[rm] || 0) + premium;

        // ------------------------
        // Company Premium
        // ------------------------

        const company = row["Company"] || "Unknown";

        companyData[company] =
            (companyData[company] || 0) + premium;

        // ------------------------
        // Medical
        // ------------------------

        const medical =
            (row["Medical"] || "").toLowerCase();

        if (
            medical.includes("done") ||
            medical.includes("complete")
        )
            medicalDone++;
        else
            medicalPending++;

        // ------------------------
        // MAP
        // ------------------------

        const map =
            (row["Map"] || "").toLowerCase();

        if (
            map.includes("done") ||
            map.includes("complete")
        )
            mapDone++;
        else
            mapPending++;

        // ------------------------
        // Issuance
        // ------------------------

        const issue =
            (row["Issuance"] || "").toLowerCase();

        if (
            issue.includes("issued") ||
            issue.includes("done")
        )
            issued++;
        else
            issuePending++;

    });

    // =====================================
    // Monthly Trend
    // =====================================

    monthlyChart = new Chart(
        document.getElementById("monthlyChart"),
        {
            type: "line",
            data: {
                labels: Object.keys(monthly),
                datasets: [{
                    label: "Premium",
                    data: Object.values(monthly),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,.25)",
                    fill: true,
                    tension: .4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

    // =====================================
    // RM Leaderboard
    // =====================================

    const rmSorted =
        Object.entries(rmData)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    leaderChart = new Chart(
        document.getElementById("leaderChart"),
        {
            type:"bar",
            data:{
                labels:rmSorted.map(x=>x[0]),
                datasets:[{
                    data:rmSorted.map(x=>x[1]),
                    backgroundColor:"#22c55e"
                }]
            },
            options:{
                indexAxis:"y",
                plugins:{
                    legend:{display:false}
                }
            }
        });

    // =====================================
    // Company Chart
    // =====================================

    companyChart = new Chart(
        document.getElementById("companyChart"),
        {
            type:"doughnut",
            data:{
                labels:Object.keys(companyData),
                datasets:[{
                    data:Object.values(companyData)
                }]
            }
        });

    // =====================================
    // Medical Status
    // =====================================

    medicalChart = new Chart(
        document.getElementById("medicalChart"),
        {
            type:"pie",
            data:{
                labels:["Done","Pending"],
                datasets:[{
                    data:[
                        medicalDone,
                        medicalPending
                    ]
                }]
            }
        });

    // =====================================
    // Insurance Status
    // =====================================

    insuranceChart = new Chart(
        document.getElementById("insuranceChart"),
        {
            type:"pie",
            data:{
                labels:["Issued","Pending"],
                datasets:[{
                    data:[
                        issued,
                        issuePending
                    ]
                }]
            }
        });

    // =====================================
    // MAP Status
    // =====================================

    mapChart = new Chart(
        document.getElementById("mapChart"),
        {
            type:"pie",
            data:{
                labels:["Done","Pending"],
                datasets:[{
                    data:[
                        mapDone,
                        mapPending
                    ]
                }]
            }
        });

}
// ===============================================
// DATE FILTER
// ===============================================

function applyDateFilter(data) {

    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;

    if (!from && !to) return data;

    return data.filter(row => {

        if (!row["Login Date"]) return false;

        const d = new Date(row["Login Date"]);

        if (from && d < new Date(from)) return false;

        if (to && d > new Date(to)) return false;

        return true;

    });

}


// ===============================================
// FILTER BUTTON
// ===============================================

document.getElementById("filterBtn").addEventListener("click", () => {

    let filtered = dashboardData;

    // Company
    const company = document.getElementById("companyFilter").value;

    if (company) {

        filtered = filtered.filter(r => r["Company"] === company);

    }

    // RM
    const rm = document.getElementById("rmFilter").value;

    if (rm) {

        filtered = filtered.filter(r => r["RM Name"] === rm);

    }

    // Date
    filtered = applyDateFilter(filtered);

    // Search
    const search = document.getElementById("searchInput").value.toLowerCase();

    if (search) {

        filtered = filtered.filter(r =>
            JSON.stringify(r).toLowerCase().includes(search)
        );

    }

    buildTable(filtered);

});


// ===============================================
// BETTER CSV PARSER
// ===============================================

function csvToJSON(csv) {

    const rows = [];
    let row = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];

        if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === ',' && !insideQuotes) {

            row.push(current);

            current = "";

        } else if ((char === '\n' || char === '\r') && !insideQuotes) {

            if (current !== "" || row.length) {

                row.push(current);

                rows.push(row);

                row = [];
                current = "";

            }

        } else {

            current += char;

        }

    }

    if (current) {

        row.push(current);

        rows.push(row);

    }

    const headers = rows.shift();

    return rows.map(r => {

        const obj = {};

        headers.forEach((h, i) => {

            obj[h.trim()] = r[i] || "";

        });

        return obj;

    });

}



// ===============================================
// AUTO REFRESH
// ===============================================

setInterval(() => {

    console.log("Refreshing Google Sheet...");

    loadDashboard();

}, 30000);



// ===============================================
// LOADER
// ===============================================

window.addEventListener("load", () => {

    setTimeout(() => {

        document.getElementById("loader")
            .classList.add("hideLoader");

    }, 1200);

});



// ===============================================
// CHART COLORS
// ===============================================

Chart.defaults.color = "#FFFFFF";

Chart.defaults.borderColor = "rgba(255,255,255,.08)";

Chart.defaults.font.family = "Inter";



// ===============================================
// DASHBOARD READY
// ===============================================

console.log("Life Insurance Dashboard Loaded");