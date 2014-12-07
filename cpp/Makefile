all: filter

filter: filtering_MAIN.o filtering.o
	g++ filtering_MAIN.o filtering.o -o filter

filtering_MAIN.o: filtering_MAIN.cpp
	g++ -c filtering_MAIN.cpp

filtering.o: filtering.cpp
	g++ -c filtering.cpp

clean:
	rm -rf *o filter
