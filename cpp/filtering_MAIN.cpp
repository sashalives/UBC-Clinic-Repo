/* filtering algorithm mainfile
 *
 * author: Sasha Heinen
 * Nov 12 2014
 */

#include <iostream>
#include <string>
#include <stdlib.h>

#include "filtering.h"

using namespace std;

int main (int argc, char *argv[]) {

	if (argc < 2) {
		cout << "Incorrect number of arguments!" << endl;
		return 1;
	}

	char * filename = argv[1];
	int numberOfFilters = 1;
	int interestingNumber = 1;

	if (argc == 4) {
		numberOfFilters = atoi(argv[2]);
		interestingNumber = atoi(argv[3]);
	} else if (argc == 3) {
		numberOfFilters = atoi(argv[2]);
	}

	string storedFileName(filename);

	Filter *filter = new Filter(filename);
	filter->runFiltering(numberOfFilters, interestingNumber);

	return 0;
}
