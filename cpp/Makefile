all: filter

filter: filtering.o filtering_MAIN.o strand.o
	g++ filtering.o filtering_MAIN.o strand.o -o filter

filtering_MAIN.o: filtering.h filtering_MAIN.cpp
	g++ -std=c++11 filtering_MAIN.cpp -c

filtering.o: filtering.h filtering.cpp
	g++ -std=c++11 filtering.cpp filtering.h -c

strand.o: strand.h strand.cpp
	g++ -std=c++11 strand.cpp strand.h -c

clean:
	rm -rf *.o filter
