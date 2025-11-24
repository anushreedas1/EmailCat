#!/bin/bash
# Comprehensive test runner for Email Productivity Agent (Unix/Linux/Mac)

set -e

echo "======================================================================"
echo "           EMAIL PRODUCTIVITY AGENT - TEST SUITE"
echo "======================================================================"
echo ""

# Make the Python script executable
chmod +x run_all_tests.py

# Run the Python test runner
python3 run_all_tests.py

# Capture exit code
EXIT_CODE=$?

echo ""
echo "======================================================================"
if [ $EXIT_CODE -eq 0 ]; then
    echo "                    ALL TESTS PASSED!"
else
    echo "                    SOME TESTS FAILED!"
fi
echo "======================================================================"

exit $EXIT_CODE
