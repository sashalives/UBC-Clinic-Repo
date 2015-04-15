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
	int numberToFilter = 2;
	int interestingNumber = 1;

	if (argc == 4) {
		if (argv[2] > 1)
			numberToFilter = atoi(argv[2]);
		else
			cerr << "Filtering by a number below 2 is generally not recommended as it can cause strange behavior. Setting your filtering value to 2."
		interestingNumber = atoi(argv[3]);
	} else if (argc == 3) {
		if (argv[2] > 1)
			numberToFilter = atoi(argv[2]);
		else
			cerr << "Filtering by a number below 2 is generally not recommended as it can cause strange behavior. Setting your filtering value to 2."
	}

	string storedFileName(filename);

	Filter *filter = new Filter(filename);
	filter->runFiltering(numberToFilter, interestingNumber);

	return 0;
}
