all: filter

filter: filtering.o filtering_MAIN.o
	g++ filtering.o filtering_MAIN.o -o filter

filtering_MAIN.o: filtering.h filtering_MAIN.cpp
	g++ -std=c++11 filtering_MAIN.cpp -c

filtering.o: filtering.h filtering.cpp
	g++ -std=c++11 filtering.cpp filtering.h -c

clean:
	rm -rf *.o filter
