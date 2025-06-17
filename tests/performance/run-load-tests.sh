#!/bin/bash

# Load Testing Runner for Onda Platform
# Runs comprehensive load tests using Artillery.js

set -e

echo "🚀 Starting Onda Platform Load Testing Suite"
echo "============================================="

# Check if server is running
echo "📡 Checking if server is running..."
if ! curl -s http://localhost:4288 > /dev/null; then
    echo "❌ Server is not running on localhost:4288"
    echo "   Please start the dev server with: npm run dev"
    exit 1
fi
echo "✅ Server is running"

# Function to run a test and capture results
run_test() {
    local test_name="$1"
    local config_file="$2"
    local report_dir="reports"
    
    echo ""
    echo "🧪 Running $test_name..."
    echo "----------------------------------------"
    
    # Create reports directory if it doesn't exist
    mkdir -p "$report_dir"
    
    # Run the test and capture output
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$report_dir/${test_name}_${timestamp}.json"
    
    if artillery run "$config_file" --output "$report_file"; then
        echo "✅ $test_name completed successfully"
        
        # Generate HTML report if possible
        if command -v artillery &> /dev/null; then
            local html_report="$report_dir/${test_name}_${timestamp}.html"
            artillery report "$report_file" --output "$html_report" 2>/dev/null || true
            if [ -f "$html_report" ]; then
                echo "📊 HTML report generated: $html_report"
            fi
        fi
    else
        echo "❌ $test_name failed"
        return 1
    fi
}

# Create reports directory
mkdir -p reports

echo ""
echo "📋 Test Plan:"
echo "  1. Basic Load Test (warm-up → sustained → peak load)"
echo "  2. Stress Test (high concurrency testing)"
echo ""

# Run basic load test
if [ -f "tests/performance/load.yml" ]; then
    run_test "basic_load_test" "tests/performance/load.yml"
else
    echo "❌ Basic load test config not found: tests/performance/load.yml"
    exit 1
fi

# Run stress test
if [ -f "tests/performance/stress-test.yml" ]; then
    run_test "stress_test" "tests/performance/stress-test.yml"
else
    echo "⚠️  Stress test config not found: tests/performance/stress-test.yml"
fi

echo ""
echo "📊 Load Testing Summary"
echo "======================="

# Count test results
total_tests=0
passed_tests=0

for report in reports/*.json; do
    if [ -f "$report" ]; then
        total_tests=$((total_tests + 1))
        # Simple check - if file exists and isn't empty, consider it passed
        if [ -s "$report" ]; then
            passed_tests=$((passed_tests + 1))
        fi
    fi
done

echo "Total tests run: $total_tests"
echo "Tests passed: $passed_tests"

if [ $passed_tests -eq $total_tests ] && [ $total_tests -gt 0 ]; then
    echo "✅ All load tests passed!"
    exit 0
else
    echo "❌ Some load tests failed or no tests were run"
    exit 1
fi