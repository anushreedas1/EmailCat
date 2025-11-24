#!/usr/bin/env python3
"""
Comprehensive test runner for Email Productivity Agent
Runs all backend tests and reports results
"""
import subprocess
import sys
import os
from pathlib import Path

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header(text):
    """Print a formatted header."""
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(70)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    """Print success message."""
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    """Print error message."""
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{RESET}")

def run_test(name, command, cwd=None):
    """Run a test and return success status."""
    print(f"\n{BOLD}Running: {name}{RESET}")
    print(f"Command: {' '.join(command)}")
    print("-" * 70)
    
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=False,
            text=True,
            check=True
        )
        print_success(f"{name} passed")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"{name} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print_error(f"{name} failed with error: {e}")
        return False

def main():
    """Run all tests."""
    print_header("EMAIL PRODUCTIVITY AGENT - TEST SUITE")
    
    # Get project root
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    
    # Check if backend directory exists
    if not backend_dir.exists():
        print_error("Backend directory not found!")
        sys.exit(1)
    
    # Track test results
    results = {}
    
    # Backend tests
    print_header("BACKEND TESTS")
    
    tests = [
        ("Database Models", ["python", "test_models.py"], backend_dir),
        ("Service Layer", ["python", "test_services.py"], backend_dir),
        ("LLM Service", ["python", "test_llm_service.py"], backend_dir),
        ("API Endpoints", ["python", "test_endpoints.py"], backend_dir),
        ("Basic API", ["python", "test_api.py"], backend_dir),
        ("Data Persistence (pytest)", ["python", "-m", "pytest", "test_data_persistence.py", "-v"], backend_dir),
    ]
    
    for name, command, cwd in tests:
        results[name] = run_test(name, command, cwd)
    
    # Print summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    total = len(results)
    
    print(f"\n{BOLD}Results:{RESET}")
    for name, success in results.items():
        if success:
            print_success(f"{name}")
        else:
            print_error(f"{name}")
    
    print(f"\n{BOLD}Total: {total} tests{RESET}")
    print_success(f"Passed: {passed}")
    if failed > 0:
        print_error(f"Failed: {failed}")
    
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print_warning("\nNote: OPENAI_API_KEY not set - LLM tests may be skipped")
    
    # Exit with appropriate code
    if failed > 0:
        print(f"\n{RED}{BOLD}Some tests failed!{RESET}")
        sys.exit(1)
    else:
        print(f"\n{GREEN}{BOLD}All tests passed!{RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
