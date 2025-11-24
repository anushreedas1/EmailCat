@echo off
REM Comprehensive test runner for Email Productivity Agent (Windows)

echo ======================================================================
echo           EMAIL PRODUCTIVITY AGENT - TEST SUITE
echo ======================================================================
echo.

REM Run the Python test runner
python run_all_tests.py

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo ======================================================================
if %EXIT_CODE% EQU 0 (
    echo                    ALL TESTS PASSED!
) else (
    echo                    SOME TESTS FAILED!
)
echo ======================================================================

exit /b %EXIT_CODE%
